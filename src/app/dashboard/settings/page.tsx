
'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserStore } from '@/store/user-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, KeyRound, Bell } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(50, { message: 'Name cannot be longer than 50 characters.' }),
  grade: z.string({ required_error: 'Please select a grade.' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user, setUser } = useUserStore();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      grade: user.grade,
    },
    mode: 'onChange',
  });

  function onSubmit(data: ProfileFormValues) {
    setUser(data);
    toast({
      title: 'Profile Updated',
      description: 'Your changes have been saved successfully.',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">Manage your account and profile settings.</p>
      </div>

      <div className="space-y-8">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User /> Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="9th Grade">9th Grade</SelectItem>
                          <SelectItem value="10th Grade">10th Grade</SelectItem>
                          <SelectItem value="11th Grade">11th Grade</SelectItem>
                          <SelectItem value="12th Grade">12th Grade</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="animated-button">Update Profile</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Separator />

        {/* Account Settings */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound /> Account</CardTitle>
                <CardDescription>Manage your account settings and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border rounded-lg">
                    <div>
                        <h4 className="font-semibold">Email Address</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                     <Button variant="outline" disabled>Change Email</Button>
                </div>
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border rounded-lg">
                    <div>
                        <h4 className="font-semibold">Password</h4>
                        <p className="text-sm text-muted-foreground">Last changed over a year ago</p>
                    </div>
                     <Button variant="outline">Change Password</Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
