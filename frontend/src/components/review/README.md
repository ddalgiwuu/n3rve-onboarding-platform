# Final Review Components

Reusable components for building comprehensive review pages in the N3RVE onboarding platform.

## Quick Start

```tsx
import {
  AccordionSection,
  InfoGrid,
  InfoItem,
  SubSection,
  FileCheckItem,
  ArtistBadges,
  ContributorsList,
  TerritoryBadges,
  FinalReviewContent
} from '@/components/review'
```

## Component Reference

### AccordionSection
Collapsible section with icon, title, and edit button.

```tsx
<AccordionSection
  icon={Disc}
  title="Album Information"
  onEdit={() => handleEdit(1)}
  defaultOpen={true}
>
  <InfoGrid columns={2}>
    <InfoItem label="Title" value={albumTitle} />
    <InfoItem label="Artist" value={artistName} />
  </InfoGrid>
</AccordionSection>
```

**Props:**
- `icon`: Lucide icon component
- `title`: Section title
- `onEdit?`: Edit callback function
- `defaultOpen?`: Initial expanded state (default: true)
- `children`: Section content

---

### InfoGrid
Responsive grid for displaying information items.

```tsx
<InfoGrid columns={2}>
  <InfoItem label="Genre" value="Pop" />
  <InfoItem label="Language" value="Korean" />
</InfoGrid>
```

**Props:**
- `columns`: 1, 2, or 3 columns (default: 2)
- `children`: InfoItem components

**Responsive:**
- Mobile: 1 column
- Tablet: 2 columns (if columns >= 2)
- Desktop: 3 columns (if columns = 3)

---

### InfoItem
Label-value pair for displaying information.

```tsx
<InfoItem
  label="Release Date"
  value="2024-01-01"
  fullWidth={false}
/>
```

**Props:**
- `label`: Display label
- `value`: Display value (ReactNode)
- `fullWidth?`: Span full grid width (default: false)

---

### SubSection
Subsection header with purple accent.

```tsx
<SubSection title="Basic Details">
  <InfoGrid columns={2}>
    {/* Info items */}
  </InfoGrid>
</SubSection>
```

**Props:**
- `title`: Subsection title
- `children`: Content

---

### FileCheckItem
File status indicator with icon and preview.

```tsx
<FileCheckItem
  label="Cover Art"
  file={coverArtFile}
  status="complete"
  type="image"
  preview={previewUrl}
/>
```

**Props:**
- `label`: File label
- `file?`: File or File[] or null
- `status`: 'complete' | 'optional' | 'missing'
- `type?`: 'audio' | 'image' | 'video' | 'text' (default: 'audio')
- `preview?`: Preview URL for images

**Status Colors:**
- Complete: Green ✅
- Optional: Yellow ⚠️
- Missing: Red ❌

---

### ArtistBadges
Display artists as colored badges.

```tsx
<ArtistBadges
  artists={albumArtists}
  color="purple"
/>
```

**Props:**
- `artists`: Artist[] with id and name
- `color?`: 'purple' | 'blue' | 'pink' | 'green' (default: 'purple')

---

### ContributorsList
Group contributors by role.

```tsx
<ContributorsList
  contributors={trackContributors}
/>
```

**Props:**
- `contributors`: Contributor[] with id, name, role, instrument?

**Output:**
```
Composer: John Doe, Jane Smith
Lyricist: Bob Johnson
Producer: Alice Cooper
```

---

### TerritoryBadges
Display territories with show more/less.

```tsx
<TerritoryBadges
  territories={selectedTerritories}
  maxVisible={10}
/>
```

**Props:**
- `territories`: string[]
- `maxVisible?`: Max visible before "show more" (default: 10)

---

### FinalReviewContent
Complete final review page component.

```tsx
<FinalReviewContent
  formData={formData}
  onEdit={handleEdit}
  t={translationFunction}
/>
```

**Props:**
- `formData`: Complete FormData interface
- `onEdit`: (stepNumber: number) => void
- `t`: Translation function (ko, en) => string

## Design System

### Colors
- **Purple**: Primary accent (#8B5CF6)
- **Pink**: Secondary accent (#EC4899)
- **Green**: Success states (#10B981)
- **Yellow**: Warning states (#F59E0B)
- **Red**: Error states (#EF4444)
- **Blue**: Info states (#3B82F6)

### Spacing
- Small: 0.5rem (2px)
- Medium: 1rem (4px)
- Large: 1.5rem (6px)
- XL: 2rem (8px)

### Border Radius
- Small: 0.5rem (8px)
- Medium: 0.75rem (12px)
- Large: 1rem (16px)
- XL: 1.5rem (24px)

### Typography
- Hero: 2xl (24px), bold
- Section: lg (18px), semibold
- Subsection: sm (14px), semibold, uppercase
- Label: sm (14px), medium, gray
- Value: base (16px), medium, white
- Badge: sm (14px), medium

## Best Practices

### 1. Always handle null/undefined
```tsx
// Good
<InfoItem
  label="UPC"
  value={formData.upc || '-'}
/>

// Bad
<InfoItem
  label="UPC"
  value={formData.upc} // Could be undefined
/>
```

### 2. Use appropriate status for files
```tsx
// Required files
<FileCheckItem
  status={file ? 'complete' : 'missing'}
/>

// Optional files
<FileCheckItem
  status={file ? 'complete' : 'optional'}
/>
```

### 3. Group related information
```tsx
<SubSection title="Basic Details">
  <InfoGrid columns={2}>
    {/* Related items */}
  </InfoGrid>
</SubSection>

<SubSection title="Copyright">
  <InfoGrid columns={2}>
    {/* Copyright items */}
  </InfoGrid>
</SubSection>
```

### 4. Use appropriate grid columns
```tsx
// 2 columns for most data
<InfoGrid columns={2}>

// 3 columns for identifiers
<InfoGrid columns={3}>
  <InfoItem label="UPC" value={upc} />
  <InfoItem label="EAN" value={ean} />
  <InfoItem label="Catalog" value={catalog} />
</InfoGrid>

// 1 column for long content
<InfoGrid columns={1}>
  <InfoItem
    label="Description"
    value={longDescription}
  />
</InfoGrid>
```

### 5. Provide edit navigation
```tsx
<AccordionSection
  onEdit={() => onEdit(1)} // Step number
>
```

## Examples

### Basic Section
```tsx
<AccordionSection
  icon={Disc}
  title="Album Information"
  onEdit={() => handleEdit(1)}
>
  <SubSection title="Basic Details">
    <InfoGrid columns={2}>
      <InfoItem label="Title" value={formData.albumTitle} />
      <InfoItem label="Type" value={formData.releaseType} />
      <InfoItem label="Genre" value={formData.primaryGenre} />
      <InfoItem label="Language" value={formData.language} />
    </InfoGrid>
  </SubSection>

  <SubSection title="Artists">
    <ArtistBadges artists={formData.albumArtists} color="purple" />
  </SubSection>
</AccordionSection>
```

### Files Section
```tsx
<AccordionSection
  icon={FileAudio}
  title="Files Checklist"
  onEdit={() => handleEdit(1)}
>
  <div className="space-y-3">
    <FileCheckItem
      label="Cover Art"
      file={formData.coverArt}
      status={formData.coverArt ? 'complete' : 'missing'}
      type="image"
      preview={coverPreview}
    />

    <FileCheckItem
      label="Audio Files"
      file={formData.audioFiles}
      status={formData.audioFiles?.length > 0 ? 'complete' : 'missing'}
      type="audio"
    />

    <FileCheckItem
      label="Marketing Assets"
      file={formData.marketingAssets}
      status={formData.marketingAssets?.length > 0 ? 'complete' : 'optional'}
      type="image"
    />
  </div>
</AccordionSection>
```

### Track Details
```tsx
<AccordionSection
  icon={Music}
  title={`Tracks (${tracks.length})`}
  onEdit={() => handleEdit(2)}
  defaultOpen={false}
>
  <div className="space-y-4">
    {tracks.map((track, index) => (
      <div key={track.id} className="p-4 rounded-xl bg-white/5">
        <h4 className="text-lg font-semibold">{track.title}</h4>

        <ArtistBadges artists={track.artists} color="blue" />

        {track.contributors.length > 0 && (
          <ContributorsList contributors={track.contributors} />
        )}
      </div>
    ))}
  </div>
</AccordionSection>
```

## Accessibility

All components include:
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Color contrast compliance (WCAG AA)
- Screen reader friendly text

## Performance

- Components use React.memo where appropriate
- Lazy loading for large lists
- Efficient re-rendering with proper key props
- Optimized image previews with URL.createObjectURL
