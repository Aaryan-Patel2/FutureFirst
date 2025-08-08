import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, BookOpen, Slack, Trophy } from 'lucide-react';
import Link from 'next/link';

const resources = [
  {
    title: 'FBLA National Website',
    description: 'The official source for all national FBLA news, events, and information.',
    href: '#',
    icon: Trophy,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400'
  },
  {
    title: 'FBLA Competitive Events Guide',
    description: 'Explore all competitive events, guidelines, and rating sheets.',
    href: '#',
    icon: BookOpen,
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400'
  },
  {
    title: 'Saugus FBLA Slack Channel',
    description: 'Connect with chapter members, ask questions, and stay updated.',
    href: '#',
    icon: Slack,
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400'
  },
];

export default function QuickResourcesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Quick Resources</h1>
        <p className="text-muted-foreground">
          Essential links and resources to help you succeed in FBLA.
        </p>
      </header>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.title} className="hover:border-primary/80 transition-all hover:shadow-lg group">
             <Link href={resource.href} target="_blank" rel="noopener noreferrer" className="block h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${resource.bgColor}`}>
                    <resource.icon className={`h-6 w-6 ${resource.textColor}`} />
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <CardDescription>{resource.description}</CardDescription>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
