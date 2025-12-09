import React from 'react';
import ContributorCard from './ContributorCard';

/**
 * Demo/Example implementation of the ContributorCard component
 * Shows how to use the redesigned card in your application
 */

const ContributorCardDemo: React.FC = () => {
  // Example contributor data matching your screenshot
  const exampleContributor = {
    id: '1',
    name: 'BTS',
    roles: ['A&R Administrator', '5 String Bass'],
    spotifyId: 'spotify:artist:3Nrfpe0tUJi4K4DXYWgMUX',
    appleMusicId: '883131348',
  };

  // Additional example contributors
  const contributors = [
    exampleContributor,
    {
      id: '2',
      name: 'Taylor Swift',
      roles: ['Vocalist', 'Songwriter', 'Producer'],
      spotifyId: 'spotify:artist:06HL4z0CvFAxyc27GXpf02',
      appleMusicId: '159260351',
    },
    {
      id: '3',
      name: 'The Weeknd',
      roles: ['Lead Vocals', 'Mixer', 'Mastering Engineer'],
      spotifyId: 'spotify:artist:1Xyo4u8uXC1ZmMpatF05PJ',
      appleMusicId: '479756766',
    },
  ];

  const handleEdit = (id: string) => {
    console.log('Edit contributor:', id);
    // Implement your edit logic here
  };

  const handleDelete = (id: string) => {
    console.log('Delete contributor:', id);
    // Implement your delete logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-3">
          Contributors
        </h1>
        <p className="text-slate-400 text-lg">
          Manage your track contributors and collaborators
        </p>
      </div>

      {/* Grid of contributor cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contributors.map((contributor) => (
          <ContributorCard
            key={contributor.id}
            contributor={contributor}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Single card example */}
      <div className="max-w-7xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-white mb-6">Single Card View</h2>
        <div className="max-w-md">
          <ContributorCard
            contributor={exampleContributor}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default ContributorCardDemo;
