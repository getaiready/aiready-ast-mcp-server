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
  DollarSign,
  TrendingDown,
  Cpu,
} from 'lucide-react';
import Modal from '../../../components/Modal';
import LeadForm from '../../../components/LeadForm';
import SystemFlow from '../../../components/SystemFlow';
import Navbar from '../../../components/Navbar';
import Breadcrumbs from '../../../components/Breadcrumbs';
import JsonLd from '../../../components/JsonLd';

const COST_NODES = [
  {
    id: 'vps',
    data: { label: '24/7 VPS ($20+/mo)', type: 'agent' },
    position: { x: 0, y: -50 },
  },
  {
    id: 'waste',
    data: { label: '90% IDLE WASTE', type: 'event' },
    position: { x: 200, y: -50 },
  },
  {
    id: 'lambda',
    data: { label: 'LAMBDA GATEWAY', type: 'bus' },
    position: { x: 0, y: 50 },
  },
  {
    id: 'fargate',
    data: { label: 'FARGATE ON-DEMAND', type: 'agent' },
    position: { x: 250, y: 50 },
  },
  {
    id: 'savings',
    data: { label: '$1/mo TARGET', type: 'bus' },
    position: { x: 500, y: 50 },
  },
];

const COST_EDGES = [
  {
    id: 'e1',
    source: 'vps',
    target: 'waste',
    label: 'Idle',
    animated: false,
    style: { stroke: '#ef4444' },
  },
  {
    id: 'e2',
    source: 'lambda',
    target: 'fargate',
    label: 'Spin up',
    animated: true,
  },
  {
    id: 'e3',
    source: 'fargate',
    target: 'savings',
    label: 'Save',
    animated: true,
  },
];

export default function BlogPost() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const apiUrl = process.env.NEXT_PUBLIC_LEAD_API_URL || '';

  const BLOG_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'The $1/Month AI Agent',
    description:
      'Breaking the 24/7 hosting trap. How to run a multi-channel AI backbone for the price of a single coffee.',
    datePublished: '2026-03-12',
    author: {
      '@type': 'Person',
      name: 'Minimalist Architect',
    },
    image:
      'https://clawmore.getaiready.dev/blog-assets/one-dollar-ai-agent.png',
    url: 'https://clawmore.getaiready.dev/blog-assets/one-dollar-ai-agent',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-cyber-purple/30 selection:text-cyber-purple font-sans">
      <JsonLd data={BLOG_JSON_LD} />
      <Navbar variant="post" />
      {/* Navigation */}

      {/* Article Header */}
      <header className="py-24 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(188,0,255,0.05)_0%,_transparent_70%)] opacity-30" />

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="text-cyber-purple font-mono text-[9px] uppercase tracking-[0.4em] font-black border border-cyber-purple/20 px-2 py-1 bg-cyber-purple/5">
                MINIMALIST_ARCHITECT
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[9px]">
                <Hash className="w-3 h-3" />
                <span>HASH: 1dollarai</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[9px]">
                <Clock className="w-3 h-3" />
                <span>06 MIN READ</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 italic leading-[1.1]">
              The $1/Month <br />
              <span className="text-cyber-purple">AI Agent</span>
            </h1>

            <p className="text-xl text-zinc-200 font-light leading-relaxed italic">
              Breaking the 24/7 hosting trap. How to run a multi-channel AI
              backbone for the price of a single coffee.
            </p>

            <div className="mt-12 relative aspect-[21/9] w-full overflow-hidden border border-white/10 rounded-sm group">
              <img
                src="/blog-assets/one-dollar-ai-agent.png"
                alt="The $1/Month AI Agent"
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
                  label: 'THE $1/MONTH AI AGENT',
                  href: '/blog/one-dollar-ai-agent',
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
                    The 24/7 Hosting Trap
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    Most AI agents are deployed on dedicated VPS instances (EC2,
                    DigitalOcean, etc.). This means you pay for compute 100% of
                    the time, even when the agent is idle. For a personal
                    assistant, this is extremely inefficient. You're effectively
                    paying a "waiting tax" for 23 hours a day.
                  </p>
                  <p className="text-zinc-200 leading-relaxed text-lg mt-6">
                    `serverlessclaw` flips the script. We don't host an agent;
                    we host a **Gateway**.
                  </p>
                </section>

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      02
                    </span>
                    Scale-to-Zero Architecture
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    By leveraging **AWS Lambda** as the primary entry point and
                    **AWS Fargate** on-demand for the reasoning engine, we
                    achieve a true "Scale-to-Zero" state. When you're not
                    talking to your agent, your infrastructure cost is
                    essentially zero.
                  </p>
                </section>

                <SystemFlow
                  nodes={COST_NODES}
                  edges={COST_EDGES}
                  height="350px"
                />

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      03
                    </span>
                    The Blueprint for $1/Month
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    Achieving the $1/month target requires aggressive
                    optimization of every AWS component. We use DynamoDB in
                    on-demand mode for task state and S3 for long-term memory.
                    The "spiky" nature of these services aligns perfectly with
                    personal AI usage patterns.
                  </p>
                  <div className="mt-8 p-6 bg-zinc-900/50 border border-white/10 rounded-sm font-mono text-[11px] text-zinc-200">
                    <div className="flex items-center gap-2 text-cyber-purple mb-2">
                      <DollarSign className="w-3 h-3" />
                      <span>COST_OPTIMIZATION_LOG.json</span>
                    </div>
                    {`{
  "compute": "Lambda (Gateway) + Fargate (On-Demand)",
  "storage": "DynamoDB (On-Demand) + S3 (Standard-IA)",
  "monthly_estimate": {
    "idle_cost": "$0.00",
    "active_cost_per_query": "$0.0004",
    "total_target": "$1.00 - $1.50"
  }
}`}
                  </div>
                </section>

                <section>
                  <h2 className="text-3xl font-black tracking-tight mb-6 flex items-center gap-4">
                    <span className="text-cyber-purple font-mono text-sm">
                      04
                    </span>
                    The Persistence Challenge
                  </h2>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    The trade-off for scale-to-zero is the "Cold Start" and
                    state loss. In our next entry, **The Bridge Pattern**, we'll
                    explain how we solved the persistent connection problem in
                    an ephemeral world.
                  </p>
                </section>
              </div>

              {/* Series Navigation */}
              <div className="mt-24 pt-12 border-t border-white/5">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.4em] mb-8">
                  Up_Next_In_The_Minimalist
                </div>
                <Link
                  href="/blog/bridge-pattern-ephemeral-persistent"
                  className="block group"
                >
                  <div className="glass-card p-8 flex items-center justify-between hover:border-cyber-purple/30 transition-all bg-white/[0.01]">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-sm bg-cyber-purple/10 flex items-center justify-center text-cyber-purple border border-cyber-purple/20">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-cyber-purple uppercase tracking-widest mb-1">
                          PART 07 // PROTOCOL_BRIDGE
                        </div>
                        <div className="text-2xl font-black italic group-hover:text-white transition-colors">
                          The Bridge Pattern: HTTP to WebSocket
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
