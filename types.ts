export interface ConversionConfig {
  mode: 'standard' | 'ai';
  useParagraphs: boolean; // If true, use <p>, else use <br><br>
  convertDivsToP: boolean;
  cleanAttributes: boolean;
  aggressiveWhitespace: boolean;
}

export interface ProcessingStats {
  originalLength: number;
  finalLength: number;
  tagsRemoved: number;
  attributesRemoved: number;
}