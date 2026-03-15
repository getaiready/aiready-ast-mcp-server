'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Hash,
  Terminal,
  Activity,
  Zap,
  ChevronRight,
  MessageSquare,
  Globe,
  Share2,
  Cpu,
} from 'lucide-react';
import Modal from '../../../components/Modal';
import LeadForm from '../../../components/LeadForm';
import SystemFlow from '../../../components/SystemFlow';
import Navbar from '../../../components/Navbar';
import Breadcrumbs from '../../../components/Breadcrumbs';
import JsonLd from '../../../components/JsonLd';

const OMNI_NODES = [
  {
    id: 'interfaces',
    data: { label: 'TELEGRAM / DISCORD / IMESSAGE', type: 'event' },
    position: { x: 0, y: 0 },
  },
  {
    id: 'gateway',
    data: { label: 'OMNI_CHANNEL_GATEWAY', type: 'bus' },
    position: { x: 250, y: 0 },
  },
  {
    id: 'core',
    data: { label: '[CLAW_CORE]', type: 'agent' },
    position: { x: 500, y: 0 },
  },
  {
    id: 'skills',
    data: { label: 'EXTENSIBLE_SKILLS', type: 'bus' },
    position: { x: 750, y: 0 },
  },
];

const OMNI_EDGES = [
  {
    id: 'e1',
    source: 'interfaces',
    target: 'gateway',
    label: 'Inbound',
    animated: true,
  },
  {
    id: 'e2',
    source: 'gateway',
    target: 'core',
    label: 'Normalize',
    animated: true,
  },
  {
    id: 'e3',
    source: 'core',
    target: 'skills',
    label: 'Execute',
    animated: true,
  },
];

export default function BlogPost() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const apiUrl = process.env.NEXT_PUBLIC_LEAD_API_URL || '';

  const POST_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Omni-Channel Command: One Agent, Six Interfaces',
    description:
      'Integrating Telegram, Discord, Slack, and even iMessage into a unified AI spine. How we built a multi-platform agent that never misses a pulse.',
    datePublished: '2026-03-21',
    author: {
      '@type': 'Organization',
      name: 'ClawMore',
    },
    image:
      'https://clawmore.getaiready.dev/blog-assets/omni-channel-ai-gateway.png',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-cyber-purple/30 selection:text-cyber-purple font-sans">
      <JsonLd data={POST_JSON_LD} />
      <Navbar variant="post" />

      {/* Article Header */}
      <header className="py-24 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(188,0,255,0.05)_0%,_transparent_70%)] opacity-30" />

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="text-cyber-purple font-mono text-[9px] uppercase tracking-[0.4em] font-black border border-cyber-purple/20 px-2 py-1 bg-cyber-purple/5">
                OMNI_CHANNEL
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[9px]">
                <Hash className="w-3 h-3" />
                <span>HASH: omni-gate</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[9px]">
                <Clock className="w-3 h-3" />
                <span>06 MIN READ</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 italic leading-[1.1]">
              Omni-Channel Command: <br />
              <span className="text-cyber-purple">
                One Agent, Six Interfaces
              </span>
            </h1>

            <p className="text-xl text-zinc-200 font-light leading-relaxed italic">
              Integrating Telegram, Discord, Slack, and even iMessage into a
              unified AI spine. How we built a multi-platform agent that never
              misses a pulse.
            </p>

            <div className="mt-12 relative aspect-[21/9] w-full overflow-hidden border border-white/10 rounded-sm group">
              <img
                src="/blog-assets/omni-channel-ai-gateway.png"
                alt="Omni-Channel Command: One Agent, Six Interfaces"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Breadcrumbs
              items={[
                { label: 'BLOG', href: '/blog' },
                {
                  label: 'OMNI-CHANNEL COMMAND',
                  href: '/blog/omni-channel-ai-gateway',
                },
              ]}
            />
            <article className="prose prose-invert prose-zinc max-w-none">
              <div className="space-y-12">
                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      01
                    </span>
                    The Fragmentation Problem
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    Current AI tools are siloed. You talk to one agent in a web
                    browser, another in your IDE, and maybe a third in a
                    dedicated mobile app. Your context is scattered across four
                    different interfaces, and none of them talk to each other.
                  </p>
                  <p className="text-zinc-200 leading-relaxed text-lg mt-6">
                    In the `serverlessclaw` philosophy, your AI agent should be
                    ubiquitous. It shouldn't matter if you're on your laptop,
                    your phone, or in a team chat—the agent is always one
                    message away.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      02
                    </span>
                    The Unified Gateway
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    We built a **Unified Gateway** that normalizes signals from
                    six different messaging platforms into a single "intent
                    stream." Whether the trigger is a `/deploy` command from
                    Telegram or a bug report from Slack, the core engine
                    receives the same structured payload.
                  </p>
                </section>

                <SystemFlow
                  nodes={OMNI_NODES}
                  edges={OMNI_EDGES}
                  height="350px"
                />

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      03
                    </span>
                    iMessage & BlueBubbles Integration
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    One of our most requested "gold" features was the iMessage
                    integration. By leveraging the BlueBubbles protocol,
                    `serverlessclaw` can act as a native contact on your iPhone.
                    You can text your agent to check server logs or deploy a
                    patch while walking to lunch.
                  </p>
                  <div className="mt-8 p-6 bg-zinc-900/50 border border-white/10 rounded-sm font-mono text-[11px] text-zinc-200">
                    <div className="flex items-center gap-2 text-cyber-purple mb-2">
                      <Share2 className="w-3 h-3" />
                      <span>GATEWAY_REGISTRY.json</span>
                    </div>
                    {`{
  "supported_channels": [
    "telegram_bot_api",
    "discord_webhooks",
    "slack_events_api",
    "bluebubbles_imessage_bridge",
    "whatsapp_business_api",
    "microsoft_teams_connector"
  ],
  "normalization_engine": "v2.4 (Neural_Node_Standard)"
}`}
                  </div>
                </section>

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      04
                    </span>
                    Stateless Identity
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    The magic of the multi-channel approach is that your
                    "identity" is maintained across all platforms via DynamoDB.
                    The agent knows you're the same user whether you're DMing it
                    on Discord or replying to a group thread in Teams.
                  </p>
                  <p className="text-zinc-200 leading-relaxed text-lg mt-6">
                    In our next entry, **Surviving the Void**, we'll dive deep
                    into the persistence layer that makes this cross-platform
                    memory possible.
                  </p>
                </section>
              </div>

              {/* Series Navigation */}
              <div className="mt-24 pt-12 border-t border-white/5">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.4em] mb-8">
                  Up_Next_In_The_Minimalist
                </div>
                <Link
                  href="/blog/surviving-void-ephemeral-persistence"
                  className="block group"
                >
                  <div className="glass-card p-8 flex items-center justify-between hover:border-cyber-purple/30 transition-all bg-white/[0.01]">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-sm bg-cyber-purple/10 flex items-center justify-center text-cyber-purple border border-cyber-purple/20">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-cyber-purple uppercase tracking-widest mb-1">
                          PART 09 // EPHEMERAL_PERSISTENCE
                        </div>
                        <div className="text-2xl font-black italic group-hover:text-white transition-colors">
                          Surviving the Void: Cross-Lifecycle Memory
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-zinc-700 group-hover:text-cyber-purple group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center text-zinc-700 text-[10px] font-mono uppercase tracking-[0.5em]">
          TERMINAL_LOCKED // 2026 PERPETUAL_EVOLUTION
        </div>
      </footer>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <LeadForm type="waitlist" onSuccess={closeModal} apiUrl={apiUrl} />
      </Modal>
    </div>
  );
}
