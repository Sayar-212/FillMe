"use client"

import { ArrowLeft, ExternalLink, Mail, Linkedin } from "lucide-react"
import { Button } from "../../components/ui/button"
import GradientBG from "../../components/gradient-bg"

export default function AboutPage() {
  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      <GradientBG subtle />
      <main className="relative z-10 mx-auto flex min-h-[100svh] max-w-4xl flex-col px-6 py-12">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4 -ml-4" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="flex-1 space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
              <img 
                src="https://i.ibb.co/cXSq1gnk/creator.jpg" 
                alt="Sayar Basu - Creator of FillMe"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Sayar Basu</h1>
              <p className="text-muted-foreground">Creator of FillMe</p>
            </div>
          </div>

          {/* Story Section */}
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">The Story Behind FillMe</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-muted-foreground">
                <p>
                  As a developer, I constantly found myself hitting the same frustrating walls with traditional storage solutions. 
                  The breaking point came when I realized how limiting GitHub's constraints were for real development work.
                </p>
                
                <div className="bg-muted/30 rounded-lg p-6 border-l-4 border-primary">
                  <h3 className="font-semibold text-foreground mb-3">The Problem</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>GitHub's 25MB file limit</strong> - Constantly blocking uploads of datasets, media files, and compiled assets</li>
                    <li>• <strong>Forced public repositories</strong> - Your ideas and projects exposed to the world before you're ready</li>
                    <li>• <strong>Risk of idea theft</strong> - Innovative concepts stolen before you can protect or monetize them</li>
                    <li>• <strong>Scattered storage</strong> - Files spread across Google Drive, Dropbox, local storage, and various cloud services</li>
                    <li>• <strong>Poor organization</strong> - No unified way to tag, search, and manage different file types</li>
                  </ul>
                </div>

                <p>
                  I needed a solution that would let me store <em>everything</em> - from massive datasets and video files 
                  to sensitive code repositories and personal projects - all in one secure, private, and organized space.
                </p>

                <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
                  <h3 className="font-semibold text-foreground mb-3">The Vision</h3>
                  <p className="text-sm">
                    FillMe was born from the simple belief that developers and creators should have 
                    private storage with no upper file limits that's as easy to use as drag-and-drop, as organized as a well-structured database, 
                    and as secure as your most sensitive projects deserve.
                  </p>
                </div>

                <p>
                  This isn't just another cloud storage app - it's a developer's sanctuary where no upper file size limits exist, 
                  privacy is guaranteed, and finding that one file from six months ago takes seconds, not hours.
                </p>
              </div>
            </div>

            {/* Features Highlight */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold">What Makes FillMe Different</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ No upper file size limits</li>
                  <li>✓ Complete privacy - your files stay yours</li>
                  <li>✓ Smart tagging and search</li>
                  <li>✓ Support for any file type</li>
                  <li>✓ Folder structure preservation</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">Built For</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Developers with large codebases</li>
                  <li>• Creators with media-heavy projects</li>
                  <li>• Students managing research data</li>
                  <li>• Anyone tired of storage limitations</li>
                </ul>
              </div>
            </div>

            {/* Contact */}
            <div className="text-center space-y-4 pt-8 border-t border-muted/20">
              <h3 className="font-semibold">Let's Connect</h3>
              <div className="flex justify-center gap-3 flex-wrap">
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:sayar.basu.cse26@heritageit.edu.in">
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.linkedin.com/in/sayar-basu-21027b261/" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://sayar-port.vercel.app" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Portfolio
                  </a>
                </Button>

              </div>
              <p className="text-xs text-muted-foreground">
                Have feedback or suggestions? I'd love to hear from you!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}