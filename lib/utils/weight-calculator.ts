// lib/utils/weight-calculator.ts

export interface PackageWeightData {
    weightActualKg?: number | string | null;
    lengthCm?: number | string | null;
    widthCm?: number | string | null;
    heightCm?: number | string | null;
    volumetricWeightKg?: number | string | null;
  }
  
  /**
   * Calculate volumetric weight using the standard formula: (L x W x H) / 5000
   * @param lengthCm - Length in centimeters
   * @param widthCm - Width in centimeters
   * @param heightCm - Height in centimeters
   * @returns Volumetric weight in kilograms
   */
  export function calculateVolumetricWeight(
    lengthCm: number,
    widthCm: number,
    heightCm: number
  ): number {
    return (lengthCm * widthCm * heightCm) / 5000;
  }
  
  /**
   * Calculate chargeable weight (the higher of actual weight and volumetric weight)
   * @param packageData - Package weight and dimension data
   * @returns Chargeable weight in kilograms
   */
  export function calculateChargeableWeight(packageData: PackageWeightData): number {
    const actualWeight = packageData.weightActualKg 
      ? parseFloat(packageData.weightActualKg.toString()) 
      : 0;
  
    let volumetricWeight = 0;
  
    // Calculate volumetric weight if dimensions are provided
    if (packageData.lengthCm && packageData.widthCm && packageData.heightCm) {
      const length = parseFloat(packageData.lengthCm.toString());
      const width = parseFloat(packageData.widthCm.toString());
      const height = parseFloat(packageData.heightCm.toString());
      
      if (length > 0 && width > 0 && height > 0) {
        volumetricWeight = calculateVolumetricWeight(length, width, height);
      }
    } else if (packageData.volumetricWeightKg) {
      // Use pre-calculated volumetric weight if available
      volumetricWeight = parseFloat(packageData.volumetricWeightKg.toString());
    }
  
    // Return the higher of actual weight and volumetric weight
    return Math.max(actualWeight, volumetricWeight);
  }
  
  /**
   * Calculate total chargeable weight for multiple packages
   * @param packages - Array of package data
   * @returns Total chargeable weight in kilograms
   */
  export function calculateTotalChargeableWeight(packages: PackageWeightData[]): number {
    return packages.reduce((total, pkg) => total + calculateChargeableWeight(pkg), 0);
  }