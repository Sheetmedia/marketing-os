import React, { useState } from 'react';
import { HelpCircle, X, ChevronRight, ChevronDown, BookOpen, Rocket, Search, Key, Link, FileText, Image, Share2, Megaphone, Target, BarChart3, Bot, Brain, Bell, Settings } from 'lucide-react';

interface GuideSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: string[];
}

const guideSections: GuideSection[] = [
  {
    id: 'getting-started',
    icon: <Rocket className="w-5 h-5 text-blue-500" />,
    title: 'Getting Started',
    description: 'First steps after logging in',
    steps: [
      'Click "Clients" in the sidebar to add your first company/website',
      'Fill in the company name, domain, industry, and marketing goals',
      'Run an SEO Audit to check your website health',
      'Add keywords you want to rank for in Google',
      'Add competitor domains to track their strategies',
      'Enable "SEO By AI" to let Atlas manage your SEO automatically',
    ],
  },
  {
    id: 'clients',
    icon: <Settings className="w-5 h-5 text-purple-500" />,
    title: 'Managing Clients',
    description: 'Add and manage the companies you work with',
    steps: [
      'Go to Clients > click "Add Client"',
      'Enter company name, website domain, and industry',
      'Add brand colors, fonts, target keywords, and competitors',
      'Set marketing goals (e.g., "Increase traffic by 50%")',
      'Click on any client card to see their full dashboard',
      'Use the Overview tab for a quick summary of all metrics',
    ],
  },
  {
    id: 'seo-audit',
    icon: <Search className="w-5 h-5 text-green-500" />,
    title: 'SEO Audit',
    description: 'Scan websites for SEO issues',
    steps: [
      'Go to SEO Audit and select your client',
      'Click "Run New Audit" to start scanning',
      'Wait 2-5 minutes for the scan to complete',
      'Review the Overall Score (aim for 70+)',
      'Check Core Web Vitals (LCP, FID, CLS)',
      'Fix Critical issues first, then Warnings, then Info items',
      'Re-run the audit after making fixes to verify improvements',
    ],
  },
  {
    id: 'keywords',
    icon: <Key className="w-5 h-5 text-yellow-500" />,
    title: 'Keyword Tracking',
    description: 'Track where you rank in Google',
    steps: [
      'Go to Keywords > click "Add Keywords"',
      'Enter keywords you want to rank for (one per line)',
      'Monitor your Position (1 = first in Google)',
      'Green arrows = improving, Red arrows = dropping',
      'Use "Research" to find new keyword opportunities with AI',
      'Focus on keywords with high volume and low difficulty',
      'Group related keywords together for better organization',
    ],
  },
  {
    id: 'backlinks',
    icon: <Link className="w-5 h-5 text-cyan-500" />,
    title: 'Backlink Monitoring',
    description: 'Track links from other websites to yours',
    steps: [
      'Go to Backlinks to see all links pointing to your site',
      'Higher Domain Authority (DA) = more valuable backlink',
      'Watch for Lost backlinks - try to recover high-DA ones',
      'Check Spam Score - disavow links with score > 50%',
      'Follow links pass SEO value, Nofollow links don\'t',
      'Use the Backlink Gap in Competitors to find link opportunities',
    ],
  },
  {
    id: 'content',
    icon: <FileText className="w-5 h-5 text-orange-500" />,
    title: 'AI Content Studio',
    description: 'Create SEO-optimized content with AI',
    steps: [
      'Go to Content Studio > click "Create Content"',
      'Choose type: Blog Article, Landing Page, Email, Ad Copy',
      'Enter topic, target keywords, and preferred tone',
      'Click "Generate with AI" and wait for your content',
      'Review the SEO Score panel on the right side',
      'Fix any issues shown with red X marks',
      'Click "Optimize with AI" for automatic SEO improvements',
      'Save as Draft, send for Review, or Publish directly',
    ],
  },
  {
    id: 'images',
    icon: <Image className="w-5 h-5 text-pink-500" />,
    title: 'AI Image Studio',
    description: 'Generate marketing visuals with AI',
    steps: [
      'Go to Image Studio and select an image type',
      'Available: Instagram Post, Facebook Ad, LinkedIn Banner, Blog Thumbnail, YouTube Thumbnail',
      'Describe what you want in the prompt field',
      'Choose a style: Photorealistic, Illustration, Minimal, etc.',
      'Add brand colors for consistency',
      'Click "Generate Image" and wait for results',
      'Download in your preferred format',
    ],
  },
  {
    id: 'social',
    icon: <Share2 className="w-5 h-5 text-blue-400" />,
    title: 'Social Media',
    description: 'Schedule and manage social posts',
    steps: [
      'Connect your social accounts (Instagram, Facebook, LinkedIn, Twitter)',
      'Click "Create Post" to write a new post',
      'Select which platforms to post to',
      'Use "AI Caption" to auto-generate captions',
      'Choose "Post Now" or "Schedule" for a future date',
      'View the Calendar tab for your posting schedule',
      'Check Analytics tab for engagement metrics',
    ],
  },
  {
    id: 'ads',
    icon: <Megaphone className="w-5 h-5 text-red-500" />,
    title: 'Ads Manager',
    description: 'Track Google, Facebook, LinkedIn ads',
    steps: [
      'Connect your ad accounts in the Accounts tab',
      'View all campaigns with their spend, CTR, and conversions',
      'CTR > 2% is good, ROAS > 3x means you\'re profitable',
      'Check Analytics for spend vs conversions trends',
      'Pause underperforming campaigns (ROAS < 1x)',
      'Use the conversion funnel to find where people drop off',
    ],
  },
  {
    id: 'campaigns',
    icon: <Target className="w-5 h-5 text-indigo-500" />,
    title: 'Campaign Planner',
    description: 'Plan multi-channel marketing campaigns',
    steps: [
      'Click "New Campaign" to start planning',
      'Set name, type (SEO/Content/Ads/Social), dates, and budget',
      'Define your goals and target channels',
      'Track budget progress and key metrics',
      'View all campaign components (content, ads, social posts)',
      'Launch when ready, pause if needed',
    ],
  },
  {
    id: 'reports',
    icon: <BarChart3 className="w-5 h-5 text-emerald-500" />,
    title: 'Reports',
    description: 'Generate client performance reports',
    steps: [
      'Go to Reports > click "Generate Report"',
      'Select client, report type, and date range',
      'Types: SEO, Ads, Content, Competitor, Comprehensive',
      'Wait for the report to generate',
      'Preview the report with charts and recommendations',
      'Download as PDF or send directly to the client',
    ],
  },
  {
    id: 'ai-assistant',
    icon: <Bot className="w-5 h-5 text-violet-500" />,
    title: 'AI Assistant',
    description: 'Chat with your marketing AI advisor',
    steps: [
      'Type any marketing question in the chat',
      'Ask about SEO strategy, content ideas, campaign planning',
      'Select a client for context-specific answers',
      'Use quick suggestion buttons for common queries',
      'Ask follow-up questions for deeper analysis',
      'Example: "What keywords should I target for my SaaS blog?"',
    ],
  },
  {
    id: 'seo-by-ai',
    icon: <Brain className="w-5 h-5 text-blue-600" />,
    title: 'SEO By AI (Atlas)',
    description: 'Fully autonomous AI SEO management',
    steps: [
      'Atlas is your autonomous AI agent that manages everything',
      'View the Action Plan to see what Atlas is doing',
      'Approve or reject actions that need your permission',
      'Check the Strategy tab for Atlas\'s marketing plan',
      'View Predictions for traffic and ranking forecasts',
      'Chat with Atlas to ask about strategy or status',
      'Configure settings: Full Auto, Semi-Auto, or Manual mode',
      'Set which actions need your approval vs auto-execute',
    ],
  },
  {
    id: 'alerts',
    icon: <Bell className="w-5 h-5 text-amber-500" />,
    title: 'Alerts & Monitoring',
    description: 'Stay on top of important changes',
    steps: [
      'Alerts notify you of ranking drops, lost backlinks, traffic drops',
      'Critical (red) = fix immediately, Warning (yellow) = fix soon',
      'Click any alert to see details and recommended actions',
      'Configure thresholds in alert settings (gear icon)',
      'Enable email/Slack notifications for critical alerts',
      'Mark alerts as read after addressing them',
    ],
  },
];

export default function HelpGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        title="Help Guide"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6" />
          <div>
            <h3 className="font-bold text-lg">Help Guide</h3>
            <p className="text-blue-100 text-sm">Step-by-step instructions</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Click any section below for step-by-step instructions
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto p-2">
        {guideSections.map((section) => (
          <div key={section.id} className="mb-1">
            <button
              onClick={() => toggleSection(section.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                expandedSection === section.id
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {section.icon}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {section.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {section.description}
                </div>
              </div>
              {expandedSection === section.id ? (
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
            </button>

            {expandedSection === section.id && (
              <div className="ml-11 mr-3 mb-3 mt-1">
                <ol className="space-y-2">
                  {section.steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-center">
        <p className="text-xs text-slate-400">
          Full guide: see USER_GUIDE.md in project root
        </p>
      </div>
    </div>
  );
}
