# Building Carbon Calculator

A web application for calculating embodied carbon emissions in building construction projects.

## Features

- Upload building data in JSON format
- Automatic calculation of embodied carbon emissions
- System-level breakdown (Skin, Superstructure, Substructure)
- Visual charts and comparisons
- Benchmark against typical office buildings
- Export results as JSON or CSV
- Responsive, modern UI built with React and Tailwind CSS

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **File Upload**: React Dropzone

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. Prepare your building data in JSON format (see sample-building.json)
2. Upload the JSON file using the drag-and-drop interface
3. Review the calculated carbon emissions
4. Analyze the system breakdown and visualizations
5. Export results as needed

## JSON Structure

The application expects a JSON file with the following structure:

```json
{
  "main": {
    "gfa": 51680,
    "amountOfLevels": 10,
    "floorToFloorHeight": 3.5,
    "floorToFloorHeightGroundFloor": 4.2
  },
  "sLayers": [
    {
      "id": "Skin",
      "layers": [
        { "id": "Roof", "area": 5168 },
        { "id": "Facade", "area": 8400 }
      ]
    },
    {
      "id": "Superstructure",
      "layers": [
        { "id": "Beam -8.4 m", "length": 1200 },
        { "id": "Floor Slab", "area": 46512 }
      ]
    }
  ]
}
```

### Supported Layer IDs

The emission factors database includes the following layer types:

**Skin System:**
- Roof
- Facade
- Glazing
- External Wall

**Superstructure System:**
- Beam -8.4 m, Beam -6.3 m
- Column -8.4 m, Column -6.3 m
- Floor Slab
- Composite Floor
- Core Wall
- Staircase

**Substructure System:**
- Foundation
- Basement Wall
- Pile
- Ground Floor Slab

## Emission Factors

Emission factors are stored in `src/data/emissionFactors.json` and can be customized based on your project requirements. Each factor includes:

- Emission factor value (kgCO2e per unit)
- Unit (per m² or per m)
- Material description

## Benchmarks

The application compares results against typical office building benchmarks:
- Low Carbon: < 400 kgCO2e/m²
- Typical: 400-600 kgCO2e/m²
- High Carbon: > 600 kgCO2e/m²

## License

MIT
