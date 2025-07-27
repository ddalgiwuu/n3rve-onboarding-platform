import * as ExcelJS from 'exceljs';
import { Submission } from '../types/submission';

interface ExcelExportOptions {
  submissions: Submission[];
  filename?: string;
  includeDetails?: boolean;
}

export const exportSubmissionsToExcel = async ({
  submissions,
  filename = 'submissions',
  includeDetails = true
}: ExcelExportOptions) => {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Overview
  const overviewSheet = workbook.addWorksheet('Overview');

  // Define columns
  overviewSheet.columns = [
    { header: 'Submission ID', key: 'submissionId', width: 15 },
    { header: 'Artist Name', key: 'artistName', width: 20 },
    { header: 'Label', key: 'label', width: 20 },
    { header: 'Release Title', key: 'releaseTitle', width: 25 },
    { header: 'Release Type', key: 'releaseType', width: 15 },
    { header: 'Genre', key: 'genre', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Submitted Date', key: 'submittedDate', width: 15 },
    { header: 'Submitted Time', key: 'submittedTime', width: 15 },
    { header: 'Last Updated', key: 'lastUpdated', width: 15 },
    { header: 'Track Count', key: 'trackCount', width: 12 },
    { header: 'Total Files', key: 'totalFiles', width: 12 },
    { header: 'Distribution', key: 'distribution', width: 30 }
  ];

  // Add data
  submissions.forEach((sub: any) => {
    const artistName = sub.artistName || sub.artist?.primaryName || 'N/A';
    const labelName = sub.labelName || sub.artist?.labelName || 'N/A';
    const releaseTitle = sub.releaseTitle || sub.album?.titleKo || sub.album?.titleEn || 'N/A';
    const releaseType = sub.releaseType || sub.album?.albumType || 'N/A';
    const genre = sub.genre || sub.album?.genre || 'N/A';
    const trackCount = sub.tracks?.length || 0;
    const fileCount = sub.files?.length || 0;
    const distribution = Array.isArray(sub.distribution) ? sub.distribution.join(', ') : 'N/A';

    overviewSheet.addRow({
      submissionId: sub.id || 'N/A',
      artistName: artistName,
      label: labelName,
      releaseTitle: releaseTitle,
      releaseType: releaseType,
      genre: genre,
      status: sub.status || 'pending',
      submittedDate: sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A',
      submittedTime: sub.createdAt ? new Date(sub.createdAt).toLocaleTimeString() : 'N/A',
      lastUpdated: sub.updatedAt ? new Date(sub.updatedAt).toLocaleDateString() : 'N/A',
      trackCount: trackCount,
      totalFiles: fileCount,
      distribution: distribution
    });
  });

  // Style the header row
  const headerRow = overviewSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 20;

  if (includeDetails) {
    // Sheet 2: Detailed Metadata
    const detailsSheet = workbook.addWorksheet('Detailed Metadata');

    // Define columns
    detailsSheet.columns = [
      { header: 'Submission ID', key: 'submissionId', width: 15 },
      { header: 'Artist Name', key: 'artistName', width: 20 },
      { header: 'Artist Email', key: 'artistEmail', width: 25 },
      { header: 'Artist Phone', key: 'artistPhone', width: 15 },
      { header: 'Label Name', key: 'labelName', width: 20 },
      { header: 'Release Title', key: 'releaseTitle', width: 25 },
      { header: 'Release Type', key: 'releaseType', width: 15 },
      { header: 'Release Date', key: 'releaseDate', width: 15 },
      { header: 'Genre', key: 'genre', width: 15 },
      { header: 'Subgenre', key: 'subgenre', width: 15 },
      { header: 'Language', key: 'language', width: 15 },
      { header: 'Copyright', key: 'copyright', width: 30 },
      { header: 'Copyright Year', key: 'copyrightYear', width: 15 },
      { header: 'UPC/EAN', key: 'upcEan', width: 15 },
      { header: 'Catalog Number', key: 'catalogNumber', width: 15 },
      { header: 'Distribution Platforms', key: 'distribution', width: 30 },
      { header: 'Spotify Artist ID', key: 'spotifyArtistId', width: 20 },
      { header: 'Apple Music Artist ID', key: 'appleMusicArtistId', width: 20 },
      { header: 'Marketing Plan', key: 'marketingPlan', width: 40 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Admin Notes', key: 'adminNotes', width: 40 }
    ];

    // Add data
    submissions.forEach((sub: any) => {
      const artistName = sub.artistName || sub.artist?.primaryName || 'N/A';
      const artistEmail = sub.artistEmail || sub.artist?.email || 'N/A';
      const artistPhone = sub.artistPhone || sub.artist?.phone || 'N/A';
      const labelName = sub.labelName || sub.artist?.labelName || 'N/A';
      const releaseTitle = sub.releaseTitle || sub.album?.titleKo || sub.album?.titleEn || 'N/A';
      const releaseType = sub.releaseType || sub.album?.albumType || 'N/A';
      const releaseDate = sub.releaseDate || sub.release?.releaseDate || sub.createdAt;
      const genre = sub.genre || sub.album?.genre || 'N/A';
      const subgenre = sub.subgenre || sub.album?.subgenre || 'N/A';
      const language = sub.language || sub.album?.language || 'N/A';
      const copyright = sub.copyright || sub.album?.copyright || 'N/A';
      const copyrightYear = sub.copyrightYear || sub.album?.copyrightYear || new Date().getFullYear();
      const upcEan = sub.upcEan || sub.album?.upcEan || 'N/A';
      const catalogNumber = sub.catalogNumber || sub.album?.catalogNumber || 'N/A';
      const distribution = Array.isArray(sub.distribution) ? sub.distribution.join(', ') : 'N/A';
      const spotifyArtistId = sub.spotifyArtistId || sub.artist?.spotifyArtistId || 'N/A';
      const appleMusicArtistId = sub.appleMusicArtistId || sub.artist?.appleMusicArtistId || 'N/A';
      const marketingPlan = sub.marketingPlan || sub.release?.marketingPlan || 'N/A';

      detailsSheet.addRow({
        submissionId: sub.id || 'N/A',
        artistName: artistName,
        artistEmail: artistEmail,
        artistPhone: artistPhone,
        labelName: labelName,
        releaseTitle: releaseTitle,
        releaseType: releaseType,
        releaseDate: releaseDate ? new Date(releaseDate).toLocaleDateString() : 'N/A',
        genre: genre,
        subgenre: subgenre,
        language: language,
        copyright: copyright,
        copyrightYear: copyrightYear,
        upcEan: upcEan,
        catalogNumber: catalogNumber,
        distribution: distribution,
        spotifyArtistId: spotifyArtistId,
        appleMusicArtistId: appleMusicArtistId,
        marketingPlan: marketingPlan,
        status: sub.status || 'pending',
        adminNotes: sub.adminNotes || 'N/A'
      });
    });

    // Style the header row
    const detailsHeaderRow = detailsSheet.getRow(1);
    detailsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    detailsHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
    detailsHeaderRow.height = 20;

    // Sheet 3: Track Information
    const tracksData: any[] = [];
    submissions.forEach((sub: any) => {
      const tracks = sub.tracks || [];
      const artistName = sub.artistName || sub.artist?.primaryName || 'N/A';
      const releaseTitle = sub.releaseTitle || sub.album?.titleKo || sub.album?.titleEn || 'N/A';
      const genre = sub.genre || sub.album?.genre || 'N/A';

      tracks.forEach((track: any, index: number) => {
        tracksData.push({
          submissionId: sub.id || 'N/A',
          artistName: artistName,
          releaseTitle: releaseTitle,
          trackNumber: index + 1,
          trackTitle: track.title || track.titleKo || track.titleEn || 'N/A',
          trackArtist: track.artist || track.artistName || artistName,
          duration: track.duration || 'N/A',
          isrc: track.isrc || 'N/A',
          genre: track.genre || genre,
          lyricsLanguage: track.lyricsLanguage || 'N/A',
          explicit: track.explicit ? 'Yes' : 'No',
          previewStart: track.previewStart || 'N/A'
        });
      });
    });

    if (tracksData.length > 0) {
      const tracksSheet = workbook.addWorksheet('Track Information');

      // Define columns
      tracksSheet.columns = [
        { header: 'Submission ID', key: 'submissionId', width: 15 },
        { header: 'Artist Name', key: 'artistName', width: 20 },
        { header: 'Release Title', key: 'releaseTitle', width: 25 },
        { header: 'Track Number', key: 'trackNumber', width: 12 },
        { header: 'Track Title', key: 'trackTitle', width: 30 },
        { header: 'Track Artist', key: 'trackArtist', width: 20 },
        { header: 'Duration', key: 'duration', width: 10 },
        { header: 'ISRC', key: 'isrc', width: 15 },
        { header: 'Genre', key: 'genre', width: 15 },
        { header: 'Lyrics Language', key: 'lyricsLanguage', width: 15 },
        { header: 'Explicit', key: 'explicit', width: 10 },
        { header: 'Preview Start', key: 'previewStart', width: 12 }
      ];

      // Add data
      tracksData.forEach(track => {
        tracksSheet.addRow(track);
      });

      // Style the header row
      const tracksHeaderRow = tracksSheet.getRow(1);
      tracksHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      tracksHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      tracksHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
      tracksHeaderRow.height = 20;
    }

    // Sheet 4: File Status
    const filesData: any[] = [];
    submissions.forEach((sub) => {
      sub.files.forEach((file) => {
        filesData.push({
          submissionId: sub.id,
          artistName: sub.artistName,
          releaseTitle: sub.releaseTitle,
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: (file.fileSize / (1024 * 1024)).toFixed(2),
          uploadDate: new Date(file.uploadedAt).toLocaleDateString(),
          uploadTime: new Date(file.uploadedAt).toLocaleTimeString(),
          status: file.status,
          url: file.url || 'N/A'
        });
      });
    });

    if (filesData.length > 0) {
      const filesSheet = workbook.addWorksheet('File Status');

      // Define columns
      filesSheet.columns = [
        { header: 'Submission ID', key: 'submissionId', width: 15 },
        { header: 'Artist Name', key: 'artistName', width: 20 },
        { header: 'Release Title', key: 'releaseTitle', width: 25 },
        { header: 'File Name', key: 'fileName', width: 30 },
        { header: 'File Type', key: 'fileType', width: 15 },
        { header: 'File Size (MB)', key: 'fileSize', width: 15 },
        { header: 'Upload Date', key: 'uploadDate', width: 15 },
        { header: 'Upload Time', key: 'uploadTime', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'URL', key: 'url', width: 40 }
      ];

      // Add data
      filesData.forEach(file => {
        filesSheet.addRow(file);
      });

      // Style the header row
      const filesHeaderRow = filesSheet.getRow(1);
      filesHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      filesHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      filesHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
      filesHeaderRow.height = 20;
    }
  }

  // Generate and download the file
  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  // Create a buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fullFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export single submission as detailed report
export const exportSubmissionReport = async (submission: Submission) => {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Submission Overview
  const overviewSheet = workbook.addWorksheet('Overview');

  // Set column widths
  overviewSheet.getColumn(1).width = 25;
  overviewSheet.getColumn(2).width = 50;

  // Add header
  const headerRow = overviewSheet.addRow(['Field', 'Value']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  const dataRows = [
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
    ['Last Updated', new Date(submission.updatedAt).toLocaleString()]
  ];

  dataRows.forEach(row => {
    const dataRow = overviewSheet.addRow(row);
    dataRow.getCell(1).font = { bold: true };
  });

  // Sheet 2: Track List
  if (submission.tracks.length > 0) {
    const tracksSheet = workbook.addWorksheet('Tracks');

    // Define columns
    tracksSheet.columns = [
      { header: 'Track #', key: 'trackNumber', width: 10 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Artist', key: 'artist', width: 25 },
      { header: 'Duration', key: 'duration', width: 10 },
      { header: 'ISRC', key: 'isrc', width: 15 },
      { header: 'Genre', key: 'genre', width: 15 },
      { header: 'Language', key: 'language', width: 15 },
      { header: 'Explicit', key: 'explicit', width: 10 },
      { header: 'Preview Start', key: 'previewStart', width: 12 }
    ];

    // Add data
    submission.tracks.forEach((track, index) => {
      tracksSheet.addRow({
        trackNumber: index + 1,
        title: track.title,
        artist: track.artist || submission.artistName,
        duration: track.duration || 'N/A',
        isrc: track.isrc || 'N/A',
        genre: track.genre || submission.genre,
        language: track.lyricsLanguage || 'N/A',
        explicit: track.explicit ? 'Yes' : 'No',
        previewStart: track.previewStart ? String(track.previewStart) : 'N/A'
      });
    });

    // Style header row
    const tracksHeaderRow = tracksSheet.getRow(1);
    tracksHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    tracksHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    tracksHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
    tracksHeaderRow.height = 20;
  }

  // Sheet 3: Files
  if (submission.files.length > 0) {
    const filesSheet = workbook.addWorksheet('Files');

    // Define columns
    filesSheet.columns = [
      { header: 'File Name', key: 'fileName', width: 30 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Size', key: 'size', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Uploaded', key: 'uploaded', width: 20 }
    ];

    // Add data
    submission.files.forEach((file) => {
      filesSheet.addRow({
        fileName: file.fileName,
        type: file.fileType,
        size: `${(file.fileSize / (1024 * 1024)).toFixed(2)} MB`,
        status: file.status,
        uploaded: new Date(file.uploadedAt).toLocaleString()
      });
    });

    // Style header row
    const filesHeaderRow = filesSheet.getRow(1);
    filesHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    filesHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    filesHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
    filesHeaderRow.height = 20;
  }

  // Sheet 4: Marketing & Notes
  const marketingSheet = workbook.addWorksheet('Marketing & Notes');

  // Set column widths
  marketingSheet.getColumn(1).width = 20;
  marketingSheet.getColumn(2).width = 80;

  // Add header
  const marketingHeaderRow = marketingSheet.addRow(['Field', 'Value']);
  marketingHeaderRow.font = { bold: true };
  marketingHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows with text wrapping
  const marketingPlanRow = marketingSheet.addRow(['Marketing Plan', submission.marketingPlan || 'No marketing plan provided']);
  marketingPlanRow.getCell(1).font = { bold: true };
  marketingPlanRow.getCell(2).alignment = { wrapText: true, vertical: 'top' };

  const adminNotesRow = marketingSheet.addRow(['Admin Notes', submission.adminNotes || 'No admin notes']);
  adminNotesRow.getCell(1).font = { bold: true };
  adminNotesRow.getCell(2).alignment = { wrapText: true, vertical: 'top' };

  // Generate filename
  const safeArtistName = submission.artistName.replace(/[^a-z0-9]/gi, '_');
  const safeReleaseTitle = submission.releaseTitle.replace(/[^a-z0-9]/gi, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${safeArtistName}_${safeReleaseTitle}_${timestamp}.xlsx`;

  // Create a buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
