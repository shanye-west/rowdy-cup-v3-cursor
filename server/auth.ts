import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { db, pool } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { User as SelectUser } from "@shared/schema";
import connectPgSimple from 'connect-pg-simple';
import { debug } from './debug';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Password hashing function
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Password comparison function
async function comparePasswords(supplied: string, stored: string) {
  // Check if we're dealing with a plain 4-digit PIN
  if (stored === "1111" || (!stored.includes('.') && stored.length === 4)) {
    // Direct comparison for 4-digit PIN
    return supplied === stored;
  }
  
  // Check if stored password has the expected format (hash.salt)
  if (!stored || !stored.includes('.')) {
    console.error('Invalid password format in database: missing salt separator');
    // Fallback for direct comparison in case the password was stored incorrectly
    return supplied === stored;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!salt) {
    console.error('Invalid password format in database: salt is missing');
    return supplied === stored;
  }
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ error: "Forbidden - Admin access required" });
}

export function setupAuth(app: Express) {
  // Ensure SESSION_SECRET is set
  if (!process.env.SESSION_SECRET) {
    debug.warn('SESSION_SECRET is not set', {}, {
      environment: process.env.NODE_ENV,
      recommendation: 'Set SESSION_SECRET for production'
    });
  }

  // Configure session with PostgreSQL store
  const PostgresStore = connectPgSimple(session);
  
  const sessionSettings: session.SessionOptions = {
    store: new PostgresStore({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'rowdy-cup-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      httpOnly: true,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
    },
    name: 'rowdy-cup.sid'
  };

  // Add error handling for session middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    debug.error('Session middleware error', { requestId: req.requestId }, {
      errorCode: err.code,
      errorMessage: err.message,
      stack: err.stack
    }, err);
    
    if (err.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({
        error: 'Invalid CSRF token. Please refresh the page and try again.'
      });
    }
    next(err);
  });

  // Initialize session before passport
  app.use(session(sessionSettings));
  
  // Session debugging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    debug.debug('Session state', { requestId: req.requestId }, {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      cookie: req.session?.cookie,
      sessionStore: (req.session as any)?.store?.constructor?.name
    });
    next();
  });
  
  // Initialize passport after session
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport with local strategy
  passport.use(
    new LocalStrategy(async (username, passcode, done) => {
      const context = { username };
      try {
        debug.info('Login attempt', context);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          debug.warn('User not found', context);
          return done(null, false);
        }
        
        debug.debug('User found, comparing passwords', context);
        const passwordMatch = await comparePasswords(passcode, user.passcode);
        
        if (!passwordMatch) {
          debug.warn('Password mismatch', context);
          return done(null, false);
        }
        
        debug.info('Login successful', { ...context, userId: user.id });
        return done(null, user);
      } catch (err) {
        debug.error('Login error', context, null, err as Error);
        return done(err);
      }
    })
  );

  // Serialize/deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth endpoints
  app.post("/api/login", (req, res, next) => {
    const context = {
      requestId: req.requestId,
      username: req.body.username,
      hasPasscode: !!req.body.passcode,
      headers: req.headers,
      cookies: req.cookies
    };
    
    debug.info('Login request received', context);
    
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: any) => {
      if (err) {
        debug.error('Passport authentication error', context, {
          error: err.message,
          stack: err.stack,
          info
        }, err);
        return next(err);
      }
      if (!user) {
        debug.warn('Authentication failed - invalid credentials', context);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          debug.error('Session login error', context, {
            error: err.message,
            stack: err.stack
          }, err);
          return next(err);
        }
        // Set session cookie explicitly
        req.session.save((err) => {
          if (err) {
            debug.error('Session save error', context, {
              error: err.message,
              stack: err.stack,
              sessionID: req.sessionID
            }, err);
            return next(err);
          }
          debug.info('Login successful, session saved', { 
            ...context, 
            userId: user.id,
            sessionID: req.sessionID,
            cookie: req.session?.cookie
          });
          return res.json({
            authenticated: true,
            user: {
              id: user.id,
              username: user.username,
              isAdmin: user.isAdmin,
              needsPasswordChange: user.needsPasswordChange,
              playerId: user.playerId
            }
          });
        });
      });
    })(req, res, next);
  });
  
  // Password change endpoint
  app.post("/api/change-password", isAuthenticated, async (req, res) => {
    try {
      // Validate the request
      const { newPassword } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Validate that new password is a 4-digit PIN
      if (!/^\d{4}$/.test(newPassword)) {
        return res.status(400).json({ error: "Password must be exactly 4 digits" });
      }
      
      // Update the user's password
      const hashedPassword = await hashPassword(newPassword);
      await db.update(users)
        .set({ 
          passcode: hashedPassword,
          needsPasswordChange: false 
        })
        .where(eq(users.id, req.user.id))
        .returning();
      
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Error changing password" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Error during logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ authenticated: false });
    }
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        isAdmin: req.user.isAdmin,
        needsPasswordChange: req.user.needsPasswordChange,
        playerId: req.user.playerId
      }
    });
  });
}