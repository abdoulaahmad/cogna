'use client';

import React from 'react';
import PublicLayout from '@/components/layout/public-layout';
import Hero from '@/components/landing/hero';
import CategoryCards from '@/components/landing/category-cards';
import FeaturedSubscriptions from '@/components/landing/featured-subscriptions';

export default function Home() {
  return (
    <PublicLayout>
      {/* 30% Dark Hero Section (Header sits sticky inside PublicLayout) */}
      <Hero />

      {/* Featured Subscriptions Section */}
      <FeaturedSubscriptions />

      {/* Browse by Category Section */}
      <CategoryCards />
    </PublicLayout>
  );
}
