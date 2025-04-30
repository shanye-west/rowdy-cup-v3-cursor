import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: number;
  name: string;
  location: string;
  description: string;
}

export default function TestCourses() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: ''
  });
  
  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching courses...');
      const response = await fetch('/api/courses');
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched courses:', data);
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCourses();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const newCourse = await response.json();
      setCourses(prev => [...prev, newCourse]);
      
      toast({
        title: 'Success',
        description: 'Course added successfully',
      });
      
      // Clear form
      setFormData({
        name: '',
        location: '',
        description: ''
      });
    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: 'Error',
        description: 'Failed to add course',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className="container p-4">
      <h1 className="text-2xl font-bold mb-4">Course Management Test</h1>
      
      <div className="grid grid-cols-1 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New Course</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Course Name
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location
                </label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <Button type="submit" className="w-full">
                Add Course
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Courses List</h2>
        <Button 
          onClick={fetchCourses} 
          variant="outline" 
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh Courses'}
        </Button>
      </div>
      
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(course => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Location:</strong> {course.location}</p>
                <p><strong>Description:</strong> {course.description || 'N/A'}</p>
                <p><strong>ID:</strong> {course.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <p>{isLoading ? 'Loading courses...' : 'No courses found'}</p>
        </div>
      )}
    </div>
  );
}