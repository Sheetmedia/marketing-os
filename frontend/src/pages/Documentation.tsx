import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Building2,
  Search,
  Key,
  Link,
  Swords,
  FileText,
  Image,
  Share2,
  Megaphone,
  Target,
  BarChart3,
  Bot,
  Brain,
  Bell,
  Settings,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Lightbulb,
  Zap,
  Library,
  Sparkles,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModuleDoc {
  id: string
  icon: React.ElementType
  title: string
  description: string
  content: React.ReactNode
}

type TFnType = ReturnType<typeof useTranslation>['t']

// ---------------------------------------------------------------------------
// Reusable Components
// ---------------------------------------------------------------------------

const ProTip = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation()
  return (
    <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
      <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-900">
        <span className="font-semibold">{t('common.proTip')}</span> {children}
      </div>
    </div>
  )
}

const Badge = ({
  color,
  children,
}: {
  color: 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray'
  children: React.ReactNode
}) => {
  const colors: Record<string, string> = {
    red: 'bg-red-100 text-red-700 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${colors[color]}`}
    >
      {children}
    </span>
  )
}

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3 border-b border-gray-100 pb-2">
    {children}
  </h3>
)

const StepList = ({ steps }: { steps: string[] }) => (
  <ol className="list-none space-y-2 my-3">
    {steps.map((step, i) => (
      <li key={i} className="flex gap-3 items-start">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
          {i + 1}
        </span>
        <span className="text-sm text-gray-700">{step}</span>
      </li>
    ))}
  </ol>
)

const SimpleTable = ({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) => (
  <div className="overflow-x-auto my-4">
    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
      <thead>
        <tr className="bg-gray-50">
          {headers.map((h, i) => (
            <th
              key={i}
              className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
            {row.map((cell, ci) => (
              <td
                key={ci}
                className="px-4 py-2.5 text-gray-600 border-b border-gray-100"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// ---------------------------------------------------------------------------
// Translation helpers
// ---------------------------------------------------------------------------

// Plain string within a module's translation subtree
const tm = (t: TFnType, id: string, key: string): string =>
  t(`documentation.modules.${id}.${key}`) as string

// Array/object value (returnObjects) within a module's translation subtree
function tmArr<T>(t: TFnType, id: string, key: string): T {
  return t(`documentation.modules.${id}.${key}`, {
    returnObjects: true,
  }) as unknown as T
}

// ---------------------------------------------------------------------------
// Module Documentation Content
// ---------------------------------------------------------------------------

function getModules(t: TFnType): ModuleDoc[] {
  return [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      title: tm(t, 'dashboard', 'title'),
      description: tm(t, 'dashboard', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'dashboard', 'whatItShowsHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'dashboard', 'whatItShowsText')}</p>

          <SectionHeading>{tm(t, 'dashboard', 'keySectionsHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'dashboard', 'keySectionsTable')}
          />

          <SectionHeading>{tm(t, 'dashboard', 'howToUseHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'dashboard', 'howToUseSteps')} />

          <ProTip>{tm(t, 'dashboard', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'clients',
      icon: Building2,
      title: tm(t, 'clients', 'title'),
      description: tm(t, 'clients', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'clients', 'howToAddHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'clients', 'howToAddSteps')} />

          <SectionHeading>{tm(t, 'clients', 'fieldsHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'clients', 'fieldsTable')}
          />

          <SectionHeading>{tm(t, 'clients', 'statusHeading')}</SectionHeading>
          <div className="space-y-2 my-3">
            <div className="flex items-center gap-2">
              <Badge color="green">{tm(t, 'clients', 'statusActiveBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'clients', 'statusActiveText')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="yellow">{tm(t, 'clients', 'statusPausedBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'clients', 'statusPausedText')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="gray">{tm(t, 'clients', 'statusArchivedBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'clients', 'statusArchivedText')}</span>
            </div>
          </div>

          <SectionHeading>{tm(t, 'clients', 'editingHeading')}</SectionHeading>
          <p className="text-sm text-gray-700 mb-2">{tm(t, 'clients', 'editingText')}</p>

          <SectionHeading>{tm(t, 'clients', 'brandKitHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'clients', 'brandKitText')}</p>

          <ProTip>{tm(t, 'clients', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'seo-audit',
      icon: Search,
      title: tm(t, 'seo-audit', 'title'),
      description: tm(t, 'seo-audit', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'seo-audit', 'whatIsHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'seo-audit', 'whatIsText')}</p>

          <SectionHeading>{tm(t, 'seo-audit', 'howToRunHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'seo-audit', 'howToRunSteps')} />

          <SectionHeading>{tm(t, 'seo-audit', 'scoresHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'seo-audit', 'scoresTable')}
          />

          <SectionHeading>{tm(t, 'seo-audit', 'vitalsHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'seo-audit', 'vitalsTable')}
          />

          <SectionHeading>{tm(t, 'seo-audit', 'severityHeading')}</SectionHeading>
          <div className="space-y-2 my-3">
            <div className="flex items-center gap-2">
              <Badge color="red">{tm(t, 'seo-audit', 'severityCriticalBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'seo-audit', 'severityCriticalText')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="yellow">{tm(t, 'seo-audit', 'severityWarningBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'seo-audit', 'severityWarningText')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="blue">{tm(t, 'seo-audit', 'severityInfoBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'seo-audit', 'severityInfoText')}</span>
            </div>
          </div>

          <SectionHeading>{tm(t, 'seo-audit', 'commonIssuesHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'seo-audit', 'commonIssuesTable')}
          />

          <ProTip>{tm(t, 'seo-audit', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'keywords',
      icon: Key,
      title: tm(t, 'keywords', 'title'),
      description: tm(t, 'keywords', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'keywords', 'whatAreHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'keywords', 'whatAreText')}</p>

          <SectionHeading>{tm(t, 'keywords', 'howToAddHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'keywords', 'howToAddSteps')} />

          <SectionHeading>{tm(t, 'keywords', 'columnsHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'keywords', 'columnsTable')}
          />

          <SectionHeading>{tm(t, 'keywords', 'rangesHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'keywords', 'rangesTable')}
          />

          <SectionHeading>{tm(t, 'keywords', 'difficultyHeading')}</SectionHeading>
          <div className="space-y-2 my-3">
            <div className="flex items-center gap-2">
              <Badge color="green">{tm(t, 'keywords', 'difficultyEasyBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'keywords', 'difficultyEasyText')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="yellow">{tm(t, 'keywords', 'difficultyMediumBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'keywords', 'difficultyMediumText')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="red">{tm(t, 'keywords', 'difficultyHardBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'keywords', 'difficultyHardText')}</span>
            </div>
          </div>

          <SectionHeading>{tm(t, 'keywords', 'serpFeaturesHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'keywords', 'serpFeaturesTable')}
          />

          <SectionHeading>{tm(t, 'keywords', 'groupsHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'keywords', 'groupsText')}</p>

          <ProTip>{tm(t, 'keywords', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'backlinks',
      icon: Link,
      title: tm(t, 'backlinks', 'title'),
      description: tm(t, 'backlinks', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'backlinks', 'whatAreHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'backlinks', 'whatAreText')}</p>

          <SectionHeading>{tm(t, 'backlinks', 'whyMatterHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'backlinks', 'whyMatterText')}</p>

          <SectionHeading>{tm(t, 'backlinks', 'metricsHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'backlinks', 'metricsTable')}
          />

          <SectionHeading>{tm(t, 'backlinks', 'goodBacklinkHeading')}</SectionHeading>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 my-3">
            {tmArr<string[]>(t, 'backlinks', 'goodBacklinkList').map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <SectionHeading>{tm(t, 'backlinks', 'monitoringHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'backlinks', 'monitoringSteps')} />

          <ProTip>{tm(t, 'backlinks', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'competitors',
      icon: Swords,
      title: tm(t, 'competitors', 'title'),
      description: tm(t, 'competitors', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'competitors', 'howToAddHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'competitors', 'howToAddSteps')} />

          <SectionHeading>{tm(t, 'competitors', 'analysisTypesHeading')}</SectionHeading>

          <h4 className="text-sm font-semibold text-gray-800 mt-4 mb-1">
            {tm(t, 'competitors', 'keywordGapHeading')}
          </h4>
          <p className="text-sm text-gray-700 mb-3">{tm(t, 'competitors', 'keywordGapText')}</p>

          <h4 className="text-sm font-semibold text-gray-800 mt-4 mb-1">
            {tm(t, 'competitors', 'contentGapHeading')}
          </h4>
          <p className="text-sm text-gray-700 mb-3">{tm(t, 'competitors', 'contentGapText')}</p>

          <h4 className="text-sm font-semibold text-gray-800 mt-4 mb-1">
            {tm(t, 'competitors', 'backlinkGapHeading')}
          </h4>
          <p className="text-sm text-gray-700 mb-3">{tm(t, 'competitors', 'backlinkGapText')}</p>

          <SectionHeading>{tm(t, 'competitors', 'insightsHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'competitors', 'insightsSteps')} />

          <ProTip>{tm(t, 'competitors', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'content-studio',
      icon: FileText,
      title: tm(t, 'content-studio', 'title'),
      description: tm(t, 'content-studio', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'content-studio', 'contentTypesHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'content-studio', 'contentTypesTable')}
          />

          <SectionHeading>{tm(t, 'content-studio', 'howToGenerateHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'content-studio', 'howToGenerateSteps')} />

          <SectionHeading>{tm(t, 'content-studio', 'toneHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'content-studio', 'toneTable')}
          />

          <SectionHeading>{tm(t, 'content-studio', 'seoPanelHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'content-studio', 'seoPanelText')}</p>

          <SectionHeading>{tm(t, 'content-studio', 'workflowHeading')}</SectionHeading>
          <div className="flex items-center gap-2 my-3 text-sm">
            <Badge color="gray">{tm(t, 'content-studio', 'workflowDraftBadge')}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <Badge color="yellow">{tm(t, 'content-studio', 'workflowReviewBadge')}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <Badge color="green">{tm(t, 'content-studio', 'workflowPublishedBadge')}</Badge>
          </div>

          <ProTip>{tm(t, 'content-studio', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'image-studio',
      icon: Image,
      title: tm(t, 'image-studio', 'title'),
      description: tm(t, 'image-studio', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'image-studio', 'typesHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'image-studio', 'typesTable')}
          />

          <SectionHeading>{tm(t, 'image-studio', 'howToGenerateHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'image-studio', 'howToGenerateSteps')} />

          <SectionHeading>{tm(t, 'image-studio', 'styleHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'image-studio', 'styleTable')}
          />

          <ProTip>{tm(t, 'image-studio', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'social-media',
      icon: Share2,
      title: tm(t, 'social-media', 'title'),
      description: tm(t, 'social-media', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'social-media', 'connectingHeading')}</SectionHeading>
          <p className="text-sm text-gray-700 mb-2">{tm(t, 'social-media', 'connectingText')}</p>
          <StepList steps={tmArr<string[]>(t, 'social-media', 'connectingSteps')} />

          <SectionHeading>{tm(t, 'social-media', 'creatingHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'social-media', 'creatingSteps')} />

          <SectionHeading>{tm(t, 'social-media', 'captionHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'social-media', 'captionText')}</p>

          <SectionHeading>{tm(t, 'social-media', 'calendarHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'social-media', 'calendarText')}</p>

          <SectionHeading>{tm(t, 'social-media', 'frequencyHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'social-media', 'frequencyTable')}
          />

          <ProTip>{tm(t, 'social-media', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'ads-manager',
      icon: Megaphone,
      title: tm(t, 'ads-manager', 'title'),
      description: tm(t, 'ads-manager', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'ads-manager', 'platformsHeading')}</SectionHeading>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 my-3">
            {tmArr<[string, string][]>(t, 'ads-manager', 'platformsList').map(([label, desc], i) => (
              <li key={i}>
                <strong>{label}</strong> - {desc}
              </li>
            ))}
          </ul>

          <SectionHeading>{tm(t, 'ads-manager', 'connectingHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'ads-manager', 'connectingSteps')} />

          <SectionHeading>{tm(t, 'ads-manager', 'metricsHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'ads-manager', 'metricsTable')}
          />

          <SectionHeading>{tm(t, 'ads-manager', 'funnelHeading')}</SectionHeading>
          <div className="flex items-center gap-2 my-3 text-sm flex-wrap">
            <Badge color="blue">{tm(t, 'ads-manager', 'funnelImpressionsBadge')}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <Badge color="purple">{tm(t, 'ads-manager', 'funnelClicksBadge')}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <Badge color="green">{tm(t, 'ads-manager', 'funnelConversionsBadge')}</Badge>
          </div>
          <p className="text-sm text-gray-700">{tm(t, 'ads-manager', 'funnelText')}</p>

          <ProTip>{tm(t, 'ads-manager', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'campaigns',
      icon: Target,
      title: tm(t, 'campaigns', 'title'),
      description: tm(t, 'campaigns', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'campaigns', 'whatIsHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'campaigns', 'whatIsText')}</p>

          <SectionHeading>{tm(t, 'campaigns', 'typesHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'campaigns', 'typesTable')}
          />

          <SectionHeading>{tm(t, 'campaigns', 'howToCreateHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'campaigns', 'howToCreateSteps')} />

          <SectionHeading>{tm(t, 'campaigns', 'lifecycleHeading')}</SectionHeading>
          <div className="flex items-center gap-2 my-3 text-sm flex-wrap">
            <Badge color="gray">{tm(t, 'campaigns', 'lifecycleDraftBadge')}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <Badge color="green">{tm(t, 'campaigns', 'lifecycleActiveBadge')}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <Badge color="yellow">{tm(t, 'campaigns', 'lifecyclePausedBadge')}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <Badge color="blue">{tm(t, 'campaigns', 'lifecycleCompletedBadge')}</Badge>
          </div>

          <SectionHeading>{tm(t, 'campaigns', 'trackingHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'campaigns', 'trackingText')}</p>

          <ProTip>{tm(t, 'campaigns', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'reports',
      icon: BarChart3,
      title: tm(t, 'reports', 'title'),
      description: tm(t, 'reports', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'reports', 'typesHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'reports', 'typesTable')}
          />

          <SectionHeading>{tm(t, 'reports', 'howToGenerateHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'reports', 'howToGenerateSteps')} />

          <SectionHeading>{tm(t, 'reports', 'sharingHeading')}</SectionHeading>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 my-3">
            {tmArr<[string, string][]>(t, 'reports', 'sharingList').map(([label, desc], i) => (
              <li key={i}>
                <strong>{label}</strong> {desc}
              </li>
            ))}
          </ul>

          <ProTip>{tm(t, 'reports', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'knowledge-brain',
      icon: Library,
      title: tm(t, 'knowledge-brain', 'title'),
      description: tm(t, 'knowledge-brain', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'knowledge-brain', 'whatIsHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'knowledge-brain', 'whatIsText')}</p>

          <SectionHeading>{tm(t, 'knowledge-brain', 'howToAddHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'knowledge-brain', 'howToAddSteps')} />

          <SectionHeading>{tm(t, 'knowledge-brain', 'searchHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'knowledge-brain', 'searchText')}</p>

          <SectionHeading>{tm(t, 'knowledge-brain', 'whatToAddHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'knowledge-brain', 'whatToAddTable')}
          />

          <SectionHeading>{tm(t, 'knowledge-brain', 'usedByHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'knowledge-brain', 'usedByText')}</p>

          <ProTip>{tm(t, 'knowledge-brain', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'marketing-brain',
      icon: Sparkles,
      title: tm(t, 'marketing-brain', 'title'),
      description: tm(t, 'marketing-brain', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'marketing-brain', 'whatIsHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'marketing-brain', 'whatIsText')}</p>

          <SectionHeading>{tm(t, 'marketing-brain', 'howToGenerateHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'marketing-brain', 'howToGenerateSteps')} />

          <SectionHeading>{tm(t, 'marketing-brain', 'reportSectionsHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'marketing-brain', 'reportSectionsTable')}
          />

          <SectionHeading>{tm(t, 'marketing-brain', 'severityHeading')}</SectionHeading>
          <div className="space-y-2 my-3">
            <div className="flex items-center gap-2">
              <Badge color="red">{tm(t, 'marketing-brain', 'severityCriticalBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'marketing-brain', 'severityCriticalText')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="yellow">{tm(t, 'marketing-brain', 'severityHighBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'marketing-brain', 'severityHighText')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="blue">{tm(t, 'marketing-brain', 'severityMediumBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'marketing-brain', 'severityMediumText')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="gray">{tm(t, 'marketing-brain', 'severityLowBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'marketing-brain', 'severityLowText')}</span>
            </div>
          </div>

          <SectionHeading>{tm(t, 'marketing-brain', 'priorityHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'marketing-brain', 'priorityText')}</p>

          <SectionHeading>{tm(t, 'marketing-brain', 'historyHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'marketing-brain', 'historyText')}</p>

          <ProTip>{tm(t, 'marketing-brain', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'ai-assistant',
      icon: Bot,
      title: tm(t, 'ai-assistant', 'title'),
      description: tm(t, 'ai-assistant', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'ai-assistant', 'whatItCanDoHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'ai-assistant', 'whatItCanDoText')}</p>

          <SectionHeading>{tm(t, 'ai-assistant', 'examplesHeading')}</SectionHeading>

          {tmArr<{ heading: string; questions: string[] }[]>(t, 'ai-assistant', 'categories').map(
            (cat) => (
              <React.Fragment key={cat.heading}>
                <h4 className="text-sm font-semibold text-gray-800 mt-4 mb-2">{cat.heading}</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {cat.questions.map((q, i) => (
                    <li key={i}>&quot;{q}&quot;</li>
                  ))}
                </ul>
              </React.Fragment>
            )
          )}

          <SectionHeading>{tm(t, 'ai-assistant', 'tipsHeading')}</SectionHeading>
          <StepList
            steps={(() => {
              const steps = tmArr<string[]>(t, 'ai-assistant', 'tipsSteps')
              const label = tm(t, 'ai-assistant', 'tipsSpecificLabel')
              return [`${label} ${steps[0]}`, ...steps.slice(1)]
            })()}
          />

          <ProTip>{tm(t, 'ai-assistant', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'seo-by-ai',
      icon: Brain,
      title: tm(t, 'seo-by-ai', 'title'),
      description: tm(t, 'seo-by-ai', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'seo-by-ai', 'whatIsHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'seo-by-ai', 'whatIsText')}</p>

          <SectionHeading>{tm(t, 'seo-by-ai', 'howItWorksHeading')}</SectionHeading>
          <div className="flex items-center gap-2 my-3 text-sm flex-wrap">
            <Badge color="blue">{tm(t, 'seo-by-ai', 'cycleMonitorBadge')}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <Badge color="purple">{tm(t, 'seo-by-ai', 'cycleAnalyzeBadge')}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <Badge color="yellow">{tm(t, 'seo-by-ai', 'cyclePlanBadge')}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <Badge color="green">{tm(t, 'seo-by-ai', 'cycleExecuteBadge')}</Badge>
            <span className="text-gray-400">&rarr;</span>
            <Badge color="blue">{tm(t, 'seo-by-ai', 'cycleLearnBadge')}</Badge>
          </div>
          <p className="text-sm text-gray-700">{tm(t, 'seo-by-ai', 'howItWorksText')}</p>

          <SectionHeading>{tm(t, 'seo-by-ai', 'actionTypesHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'seo-by-ai', 'actionTypesTable')}
          />

          <SectionHeading>{tm(t, 'seo-by-ai', 'actionCategoriesHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'seo-by-ai', 'actionCategoriesTable')}
          />

          <SectionHeading>{tm(t, 'seo-by-ai', 'autopilotHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'seo-by-ai', 'autopilotTable')}
          />

          <SectionHeading>{tm(t, 'seo-by-ai', 'strategyTabHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'seo-by-ai', 'strategyTabText')}</p>

          <SectionHeading>{tm(t, 'seo-by-ai', 'chattingHeading')}</SectionHeading>
          <p className="text-sm text-gray-700 mb-2">{tm(t, 'seo-by-ai', 'chattingText')}</p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {tmArr<string[]>(t, 'seo-by-ai', 'chattingExamples').map((ex, i) => (
              <li key={i}>&quot;{ex}&quot;</li>
            ))}
          </ul>

          <ProTip>{tm(t, 'seo-by-ai', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'alerts',
      icon: Bell,
      title: tm(t, 'alerts', 'title'),
      description: tm(t, 'alerts', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'alerts', 'typesHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'alerts', 'typesTable')}
          />

          <SectionHeading>{tm(t, 'alerts', 'severityHeading')}</SectionHeading>
          <div className="space-y-2 my-3">
            <div className="flex items-center gap-2">
              <Badge color="red">{tm(t, 'alerts', 'severityCriticalBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'alerts', 'severityCriticalText')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="yellow">{tm(t, 'alerts', 'severityWarningBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'alerts', 'severityWarningText')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="blue">{tm(t, 'alerts', 'severityInfoBadge')}</Badge>
              <span className="text-sm text-gray-600">{tm(t, 'alerts', 'severityInfoText')}</span>
            </div>
          </div>

          <SectionHeading>{tm(t, 'alerts', 'managingHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'alerts', 'managingSteps')} />

          <SectionHeading>{tm(t, 'alerts', 'channelsHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'alerts', 'channelsTable')}
          />

          <SectionHeading>{tm(t, 'alerts', 'frequencyHeading')}</SectionHeading>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 my-3">
            {tmArr<[string, string][]>(t, 'alerts', 'frequencyList').map(([label, desc], i) => (
              <li key={i}>
                <strong>{label}</strong> {desc}
              </li>
            ))}
          </ul>

          <ProTip>{tm(t, 'alerts', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'settings',
      icon: Settings,
      title: tm(t, 'settings', 'title'),
      description: tm(t, 'settings', 'description'),
      content: (
        <>
          <SectionHeading>{tm(t, 'settings', 'profileHeading')}</SectionHeading>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 my-3">
            {tmArr<[string, string][]>(t, 'settings', 'profileList').map(([label, desc], i) => (
              <li key={i}>
                <strong>{label}</strong> {desc}
              </li>
            ))}
          </ul>

          <SectionHeading>{tm(t, 'settings', 'agencyHeading')}</SectionHeading>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 my-3">
            {tmArr<[string, string][]>(t, 'settings', 'agencyList').map(([label, desc], i) => (
              <li key={i}>
                <strong>{label}</strong> {desc}
              </li>
            ))}
          </ul>

          <SectionHeading>{tm(t, 'settings', 'integrationsHeading')}</SectionHeading>
          <SimpleTable
            {...tmArr<{ headers: string[]; rows: string[][] }>(t, 'settings', 'integrationsTable')}
          />

          <SectionHeading>{tm(t, 'settings', 'notificationsHeading')}</SectionHeading>
          <p className="text-sm text-gray-700">{tm(t, 'settings', 'notificationsText')}</p>

          <SectionHeading>{tm(t, 'settings', 'apiKeysHeading')}</SectionHeading>
          <StepList steps={tmArr<string[]>(t, 'settings', 'apiKeysSteps')} />

          <ProTip>{tm(t, 'settings', 'protip')}</ProTip>
        </>
      ),
    },
    {
      id: 'glossary',
      icon: BookOpen,
      title: tm(t, 'glossary', 'title'),
      description: tm(t, 'glossary', 'description'),
      content: (
        <>
          <p className="text-sm text-gray-700 mb-4">{tm(t, 'glossary', 'intro')}</p>
          <div className="space-y-3">
            {tmArr<[string, string][]>(t, 'glossary', 'terms').map(([term, definition]) => (
              <div key={term} className="border-b border-gray-100 pb-3">
                <dt className="text-sm font-semibold text-gray-900">{term}</dt>
                <dd className="text-sm text-gray-600 mt-0.5">{definition}</dd>
              </div>
            ))}
          </div>

          <ProTip>{tm(t, 'glossary', 'protip')}</ProTip>
        </>
      ),
    },
  ]
}

// ---------------------------------------------------------------------------
// Main Documentation Component
// ---------------------------------------------------------------------------

const Documentation: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const contentRef = useRef<HTMLDivElement>(null)

  // Recompute the modules array (and its translated strings) whenever the
  // active language changes.
  const modules = useMemo(() => getModules(t), [i18n.language, t])

  // Handle scroll - show/hide back to top and track active section
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)

      // Determine active section
      const entries = Object.entries(moduleRefs.current)
      for (let i = entries.length - 1; i >= 0; i--) {
        const [id, el] = entries[i]
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 150) {
            setActiveSection(id)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const scrollToModule = (id: string) => {
    const el = moduleRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setExpandedModules((prev) => new Set(prev).add(id))
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Filter modules based on search
  const filteredModules = modules.filter((m) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    )
  })

  // Quick start steps
  const quickStartStepsData = t('documentation.quickStart.steps', {
    returnObjects: true,
  }) as unknown as { title: string; description: string }[]
  const quickStartIcons = [Building2, Search, Key, Brain]
  const quickStartColors = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-purple-500 to-purple-600',
    'from-amber-500 to-amber-600',
  ]
  const quickStartSteps = quickStartStepsData.map((s, i) => ({
    step: i + 1,
    title: s.title,
    description: s.description,
    icon: quickStartIcons[i],
    color: quickStartColors[i],
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Hero Section                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-10 h-10 text-blue-200" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {t('documentation.hero.title')}
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            {t('documentation.hero.subtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('documentation.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300/50 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ---------------------------------------------------------------- */}
        {/* Quick Start Guide                                                 */}
        {/* ---------------------------------------------------------------- */}
        {!searchQuery && (
          <section className="mb-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
                {t('documentation.quickStart.badge')}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('documentation.quickStart.heading')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {quickStartSteps.map((item) => (
                <div
                  key={item.step}
                  className="relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}
                  >
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Main Content Area with Sidebar                                    */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex gap-8">
          {/* Sidebar - Table of Contents (desktop only) */}
          {!searchQuery && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-8">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {t('documentation.toc.heading')}
                </h3>
                <nav className="space-y-0.5">
                  {modules.map((m) => {
                    const Icon = m.icon
                    return (
                      <button
                        key={m.id}
                        onClick={() => scrollToModule(m.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          activeSection === m.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{m.title}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </aside>
          )}

          {/* Module Documentation Cards */}
          <div ref={contentRef} className="flex-1 min-w-0">
            <section>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {searchQuery
                    ? t('documentation.search.resultsHeading', { count: filteredModules.length })
                    : t('documentation.moduleSection.heading')}
                </h2>
                {!searchQuery && (
                  <p className="text-gray-500 mt-2">
                    {t('documentation.moduleSection.subtitle')}
                  </p>
                )}
              </div>

              {filteredModules.length === 0 && (
                <div className="text-center py-16">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">
                    {t('documentation.search.noResultsTitle')}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {t('documentation.search.noResultsSubtitle')}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {filteredModules.map((m) => {
                  const Icon = m.icon
                  const isExpanded = expandedModules.has(m.id)
                  return (
                    <div
                      key={m.id}
                      ref={(el) => {
                        moduleRefs.current[m.id] = el
                      }}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors scroll-mt-8"
                    >
                      {/* Card Header */}
                      <button
                        onClick={() => toggleModule(m.id)}
                        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-gray-900">
                            {m.title}
                          </h2>
                          <p className="text-sm text-gray-500 truncate">
                            {m.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-gray-400">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-5 pb-6 border-t border-gray-100">
                          <div className="pt-4 max-w-none">{m.content}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Back to Top Button                                                  */}
      {/* ------------------------------------------------------------------ */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
          aria-label={t('documentation.backToTopLabel')}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export default Documentation
