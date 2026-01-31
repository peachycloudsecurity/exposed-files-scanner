# CSV Splitter for Top 1M Domains

This directory contains scripts to split large CSV files containing domains into smaller chunks of 500 domains per file.

## Current Status

⚠️ **Note**: The `top-1m.csv` file currently contains only a placeholder. You'll need to add the actual domain data before splitting.

## Usage

### Option 1: Python Script (Recommended)

```bash
cd dataset
python3 split_csv.py
```

Or with custom parameters:
```bash
python3 split_csv.py top-1m.csv split 500
```

**Parameters:**
- `top-1m.csv` - Input CSV file (default)
- `split` - Output directory (default)
- `500` - Domains per file (default)

### Option 2: Bash Script

```bash
cd dataset
./split_csv.sh
```

Or edit the script to change:
- `INPUT_FILE` - Input file name
- `OUTPUT_DIR` - Output directory
- `CHUNK_SIZE` - Domains per file (default: 500)

## CSV Format

The script supports CSV files with:
- **Number,domain format**: `28,google.co.uk` (extracts only domain, ignores number)
- **With header**: First row contains column name (domain, url, host, etc.)
- **Without header**: First row is data
- **Domain only**: Single column with just domains

Example formats:

**Number,domain format (most common):**
```csv
1,google.com
2,facebook.com
3,youtube.com
```
**Output will be:**
```csv
domain
google.com
facebook.com
youtube.com
```

**With header:**
```csv
domain
example.com
google.com
github.com
```

**Without header:**
```csv
example.com
google.com
github.com
```

**Note**: The scripts automatically detect the format and extract only the domain part, removing any numbers or rank columns.

## Output

Split files will be saved in the `split/` directory with naming:
- `top-1m_part_0001.csv` (domains 1-500)
- `top-1m_part_0002.csv` (domains 501-1000)
- `top-1m_part_0003.csv` (domains 1001-1500)
- ... and so on

## Expected Output for 1M Domains

For a file with 1,000,000 domains:
- **Total files**: 2,000 files
- **Domains per file**: 500
- **Last file**: Will contain remaining domains (may be less than 500)

## Example

```bash
# Split the file
python3 split_csv.py top-1m.csv split 500

# Output:
# Reading top-1m.csv...
# Found 1000000 domains
# Splitting into 2000 files with 500 domains each...
# Created: top-1m_part_0001.csv (500 domains)
# Created: top-1m_part_0002.csv (500 domains)
# ...
# ✓ Split complete! Created 2000 files in split
```

## Notes

- The script automatically detects headers
- Empty lines are skipped
- Invalid entries are filtered
- Each output file maintains the same format as input (with/without header)
