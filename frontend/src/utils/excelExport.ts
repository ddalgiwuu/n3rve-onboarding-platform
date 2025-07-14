import * as XLSX from 'xlsx';
import { Submission } from '../types/submission';

interface ExcelExportOptions {
  submissions: Submission[];
  filename?: string;
  includeDetails?: boolean;
}

export const exportSubmissionsToExcel = ({
  submissions,
  filename = 'submissions',
  includeDetails = true,
}: ExcelExportOptions) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Overview
  const overviewData = submissions.map((sub) => ({
    'Submission ID': sub.id,
    'Artist Name': sub.artistName,
    'Label': sub.labelName || 'N/A',
    'Release Title': sub.releaseTitle,
    'Release Type': sub.releaseType,
    'Genre': sub.genre,
    'Status': sub.status,
    'Submitted Date': new Date(sub.createdAt).toLocaleDateString(),
    'Submitted Time': new Date(sub.createdAt).toLocaleTimeString(),
    'Last Updated': new Date(sub.updatedAt).toLocaleDateString(),
    'Track Count': sub.tracks.length,
    'Total Files': sub.files.length,
    'Distribution': sub.distribution.join(', '),
  }));

  const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
  
  // Apply column widths
  const overviewCols = [
    { wch: 15 }, // Submission ID
    { wch: 20 }, // Artist Name
    { wch: 20 }, // Label
    { wch: 25 }, // Release Title
    { wch: 15 }, // Release Type
    { wch: 15 }, // Genre
    { wch: 12 }, // Status
    { wch: 15 }, // Submitted Date
    { wch: 15 }, // Submitted Time
    { wch: 15 }, // Last Updated
    { wch: 12 }, // Track Count
    { wch: 12 }, // Total Files
    { wch: 30 }, // Distribution
  ];
  overviewSheet['!cols'] = overviewCols;

  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  if (includeDetails) {
    // Sheet 2: Detailed Metadata
    const detailsData = submissions.map((sub) => ({
      'Submission ID': sub.id,
      'Artist Name': sub.artistName,
      'Artist Email': sub.artistEmail,
      'Artist Phone': sub.artistPhone,
      'Label Name': sub.labelName || 'N/A',
      'Release Title': sub.releaseTitle,
      'Release Type': sub.releaseType,
      'Release Date': new Date(sub.releaseDate).toLocaleDateString(),
      'Genre': sub.genre,
      'Subgenre': sub.subgenre || 'N/A',
      'Language': sub.language,
      'Copyright': sub.copyright,
      'Copyright Year': sub.copyrightYear,
      'UPC/EAN': sub.upcEan || 'N/A',
      'Catalog Number': sub.catalogNumber || 'N/A',
      'Distribution Platforms': sub.distribution.join(', '),
      'Spotify Artist ID': sub.spotifyArtistId || 'N/A',
      'Apple Music Artist ID': sub.appleMusicArtistId || 'N/A',
      'Marketing Plan': sub.marketingPlan || 'N/A',
      'Status': sub.status,
      'Admin Notes': sub.adminNotes || 'N/A',
    }));

    const detailsSheet = XLSX.utils.json_to_sheet(detailsData);
    
    // Apply column widths
    const detailsCols = [
      { wch: 15 }, // Submission ID
      { wch: 20 }, // Artist Name
      { wch: 25 }, // Artist Email
      { wch: 15 }, // Artist Phone
      { wch: 20 }, // Label Name
      { wch: 25 }, // Release Title
      { wch: 15 }, // Release Type
      { wch: 15 }, // Release Date
      { wch: 15 }, // Genre
      { wch: 15 }, // Subgenre
      { wch: 15 }, // Language
      { wch: 30 }, // Copyright
      { wch: 15 }, // Copyright Year
      { wch: 15 }, // UPC/EAN
      { wch: 15 }, // Catalog Number
      { wch: 30 }, // Distribution
      { wch: 20 }, // Spotify ID
      { wch: 20 }, // Apple ID
      { wch: 40 }, // Marketing Plan
      { wch: 12 }, // Status
      { wch: 40 }, // Admin Notes
    ];
    detailsSheet['!cols'] = detailsCols;

    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Detailed Metadata');

    // Sheet 3: Track Information
    const tracksData: any[] = [];
    submissions.forEach((sub) => {
      sub.tracks.forEach((track, index) => {
        tracksData.push({
          'Submission ID': sub.id,
          'Artist Name': sub.artistName,
          'Release Title': sub.releaseTitle,
          'Track Number': index + 1,
          'Track Title': track.title,
          'Track Artist': track.artist || sub.artistName,
          'Duration': track.duration || 'N/A',
          'ISRC': track.isrc || 'N/A',
          'Genre': track.genre || sub.genre,
          'Lyrics Language': track.lyricsLanguage || 'N/A',
          'Explicit': track.explicit ? 'Yes' : 'No',
          'Preview Start': track.previewStart || 'N/A',
        });
      });
    });

    if (tracksData.length > 0) {
      const tracksSheet = XLSX.utils.json_to_sheet(tracksData);
      
      const tracksCols = [
        { wch: 15 }, // Submission ID
        { wch: 20 }, // Artist Name
        { wch: 25 }, // Release Title
        { wch: 12 }, // Track Number
        { wch: 30 }, // Track Title
        { wch: 20 }, // Track Artist
        { wch: 10 }, // Duration
        { wch: 15 }, // ISRC
        { wch: 15 }, // Genre
        { wch: 15 }, // Lyrics Language
        { wch: 10 }, // Explicit
        { wch: 12 }, // Preview Start
      ];
      tracksSheet['!cols'] = tracksCols;

      XLSX.utils.book_append_sheet(workbook, tracksSheet, 'Track Information');
    }

    // Sheet 4: File Status
    const filesData: any[] = [];
    submissions.forEach((sub) => {
      sub.files.forEach((file) => {
        filesData.push({
          'Submission ID': sub.id,
          'Artist Name': sub.artistName,
          'Release Title': sub.releaseTitle,
          'File Name': file.fileName,
          'File Type': file.fileType,
          'File Size (MB)': (file.fileSize / (1024 * 1024)).toFixed(2),
          'Upload Date': new Date(file.uploadedAt).toLocaleDateString(),
          'Upload Time': new Date(file.uploadedAt).toLocaleTimeString(),
          'Status': file.status,
          'URL': file.url || 'N/A',
        });
      });
    });

    if (filesData.length > 0) {
      const filesSheet = XLSX.utils.json_to_sheet(filesData);
      
      const filesCols = [
        { wch: 15 }, // Submission ID
        { wch: 20 }, // Artist Name
        { wch: 25 }, // Release Title
        { wch: 30 }, // File Name
        { wch: 15 }, // File Type
        { wch: 15 }, // File Size
        { wch: 15 }, // Upload Date
        { wch: 15 }, // Upload Time
        { wch: 12 }, // Status
        { wch: 40 }, // URL
      ];
      filesSheet['!cols'] = filesCols;

      XLSX.utils.book_append_sheet(workbook, filesSheet, 'File Status');
    }
  }

  // Apply styles to all sheets
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    
    // Style header row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (sheet[cellAddress]) {
        sheet[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }
    }
  });

  // Generate and download the file
  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${timestamp}.xlsx`;
  
  XLSX.writeFile(workbook, fullFilename);
};

// Export single submission as detailed report
export const exportSubmissionReport = (submission: Submission) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Submission Overview
  const overviewData = [
    ['Field', 'Value'],
    ['Submission ID', submission.id],
    ['Status', submission.status],
    ['Artist Name', submission.artistName],
    ['Artist Email', submission.artistEmail],
    ['Artist Phone', submission.artistPhone],
    ['Label Name', submission.labelName || 'N/A'],
    ['Release Title', submission.releaseTitle],
    ['Release Type', submission.releaseType],
    ['Release Date', new Date(submission.releaseDate).toLocaleDateString()],
    ['Genre', submission.genre],
    ['Subgenre', submission.subgenre || 'N/A'],
    ['Language', submission.language],
    ['Copyright', submission.copyright],
    ['Copyright Year', submission.copyrightYear],
    ['UPC/EAN', submission.upcEan || 'N/A'],
    ['Catalog Number', submission.catalogNumber || 'N/A'],
    ['Distribution Platforms', submission.distribution.join(', ')],
    ['Spotify Artist ID', submission.spotifyArtistId || 'N/A'],
    ['Apple Music Artist ID', submission.appleMusicArtistId || 'N/A'],
    ['Submitted Date', new Date(submission.createdAt).toLocaleString()],
    ['Last Updated', new Date(submission.updatedAt).toLocaleString()],
  ];

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  overviewSheet['!cols'] = [{ wch: 25 }, { wch: 50 }];
  
  // Style the header
  overviewSheet['A1'].s = { font: { bold: true } };
  overviewSheet['B1'].s = { font: { bold: true } };

  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  // Sheet 2: Track List
  if (submission.tracks.length > 0) {
    const trackHeaders = [
      'Track #',
      'Title',
      'Artist',
      'Duration',
      'ISRC',
      'Genre',
      'Language',
      'Explicit',
      'Preview Start',
    ];

    const trackData = [trackHeaders];
    submission.tracks.forEach((track, index) => {
      trackData.push([
        (index + 1).toString(),
        track.title,
        track.artist || submission.artistName,
        track.duration || 'N/A',
        track.isrc || 'N/A',
        track.genre || submission.genre,
        track.lyricsLanguage || 'N/A',
        track.explicit ? 'Yes' : 'No',
        track.previewStart || 'N/A',
      ]);
    });

    const tracksSheet = XLSX.utils.aoa_to_sheet(trackData);
    tracksSheet['!cols'] = [
      { wch: 10 },
      { wch: 30 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(workbook, tracksSheet, 'Tracks');
  }

  // Sheet 3: Files
  if (submission.files.length > 0) {
    const fileHeaders = ['File Name', 'Type', 'Size', 'Status', 'Uploaded'];
    const fileData = [fileHeaders];

    submission.files.forEach((file) => {
      fileData.push([
        file.fileName,
        file.fileType,
        `${(file.fileSize / (1024 * 1024)).toFixed(2)} MB`,
        file.status,
        new Date(file.uploadedAt).toLocaleString(),
      ]);
    });

    const filesSheet = XLSX.utils.aoa_to_sheet(fileData);
    filesSheet['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, filesSheet, 'Files');
  }

  // Sheet 4: Marketing & Notes
  const marketingData = [
    ['Field', 'Value'],
    ['Marketing Plan', submission.marketingPlan || 'No marketing plan provided'],
    ['Admin Notes', submission.adminNotes || 'No admin notes'],
  ];

  const marketingSheet = XLSX.utils.aoa_to_sheet(marketingData);
  marketingSheet['!cols'] = [{ wch: 20 }, { wch: 80 }];
  
  // Enable text wrapping for long content
  if (marketingSheet['B2']) {
    marketingSheet['B2'].s = { alignment: { wrapText: true } };
  }
  if (marketingSheet['B3']) {
    marketingSheet['B3'].s = { alignment: { wrapText: true } };
  }

  XLSX.utils.book_append_sheet(workbook, marketingSheet, 'Marketing & Notes');

  // Generate filename
  const safeArtistName = submission.artistName.replace(/[^a-z0-9]/gi, '_');
  const safeReleaseTitle = submission.releaseTitle.replace(/[^a-z0-9]/gi, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${safeArtistName}_${safeReleaseTitle}_${timestamp}.xlsx`;

  XLSX.writeFile(workbook, filename);
};