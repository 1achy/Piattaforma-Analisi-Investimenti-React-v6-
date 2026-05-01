import { SectorAverageMetrics } from '../types';

export const parseSectorAveragesCSV = async (csvUrl: string): Promise<SectorAverageMetrics[]> => {
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== ''); // Split by new line and remove empty lines

    if (lines.length < 2) { // Should have at least header + 1 data line
      console.warn('CSV file has insufficient data (less than 2 lines).');
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const sectorData: SectorAverageMetrics[] = [];

    // Find indices of relevant columns
    const sectorIndex = headers.indexOf('Settore');
    const peIndex = headers.indexOf('P/E Medio');
    const pbIndex = headers.indexOf('P/B Medio');
    const roeIndex = headers.indexOf('ROE Medio (%)');
    const deIndex = headers.indexOf('D/E Medio');

    if (sectorIndex === -1 || peIndex === -1 || pbIndex === -1 || roeIndex === -1 || deIndex === -1) {
        console.error('CSV headers are missing or incorrect. Expected "Settore", "P/E Medio", "P/B Medio", "ROE Medio (%)", "D/E Medio". Found:', headers);
        return [];
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) {
          console.warn(`Skipping malformed CSV line ${i+1}: ${lines[i]}`);
          continue;
      }

      const sector = values[sectorIndex].trim();
      
      const peString = values[peIndex]?.trim();
      const pe = (peString && peString.toUpperCase() !== 'N/A') ? parseFloat(peString) : null;

      const pbString = values[pbIndex]?.trim();
      const pb = (pbString && pbString.toUpperCase() !== 'N/A') ? parseFloat(pbString) : null;
      
      const roeString = values[roeIndex]?.trim().replace('%', '');
      const roe = (roeString && roeString.toUpperCase() !== 'N/A') ? parseFloat(roeString) : null;
      
      const deString = values[deIndex]?.trim();
      const de = (deString && deString.toUpperCase() !== 'N/A') ? parseFloat(deString) : null;

      sectorData.push({
        sector,
        pe: !isNaN(pe!) ? pe : null,
        pb: !isNaN(pb!) ? pb : null,
        roe: !isNaN(roe!) ? roe : null,
        de: !isNaN(de!) ? de : null,
      });
    }
    return sectorData;
  } catch (error) {
    console.error("Error parsing sector averages CSV:", error);
    return []; // Return empty array on error
  }
};
