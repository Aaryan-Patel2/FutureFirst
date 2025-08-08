
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, BookOpen, Slack, Trophy } from 'lucide-react';
import Link from 'next/link';

const resources = [
  {
    title: 'FBLA National Website',
    description: 'The official source for all national FBLA news, events, and information.',
    href: 'https://www.fbla.org/',
    icon: Trophy,
  },
  {
    title: 'FBLA Competitive Events Guide',
    description: 'Explore all competitive events, guidelines, and rating sheets.',
    href: 'https://www.fbla.org/high-school/competitive-events/',
    icon: BookOpen,
  },
  {
    title: 'Saugus FBLA Slack Channel',
    description: 'Connect with chapter members, ask questions, and stay updated.',
    href: 'https://join.slack.com/t/saugusfbla/shared_invite/zt-3aysrseae-2GRsO2MRCFaFE5_ZW0ghCw',
    icon: Slack,
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
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <div key={resource.title} className="gradient-border group relative rounded-lg">
             <Link href={resource.href} target="_blank" rel="noopener noreferrer" className="block h-full rounded-lg bg-card p-6 transition-all duration-300 hover:-translate-y-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full bg-secondary`}>
                    <resource.icon className={`h-6 w-6 text-cyan-400`} />
                  </div>
                  <CardTitle className="text-lg text-foreground">{resource.title}</CardTitle>
                </div>
                <CardDescription>{resource.description}</CardDescription>
                <ArrowUpRight className="absolute top-4 right-4 h-5 w-5 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
