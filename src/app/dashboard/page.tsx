import { AiStudyBuddyClient } from './ai-study-buddy-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function AiStudyBuddyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card className="border-0 md:border shadow-none md:shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">AI Study Buddy</CardTitle>
          <CardDescription>Upload your study materials and ask me anything!</CardDescription>
        </CardHeader>
        <CardContent>
          <AiStudyBuddyClient />
        </CardContent>
      </Card>
    </div>
  );
}
