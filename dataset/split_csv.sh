#!/bin/bash
# Split CSV file into multiple files with 500 domains each

INPUT_FILE="top-1m.csv"
OUTPUT_DIR="split"
CHUNK_SIZE=500

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Get base filename
BASE_NAME=$(basename "$INPUT_FILE" .csv)

# Count total lines (excluding header if present)
TOTAL_LINES=$(tail -n +2 "$INPUT_FILE" 2>/dev/null | wc -l | tr -d ' ')
if [ -z "$TOTAL_LINES" ] || [ "$TOTAL_LINES" -eq 0 ]; then
    TOTAL_LINES=$(wc -l < "$INPUT_FILE" | tr -d ' ')
fi

echo "Total lines in file: $TOTAL_LINES"

# Check if first line is header
FIRST_LINE=$(head -n 1 "$INPUT_FILE")
FIRST_WORD=$(echo "$FIRST_LINE" | cut -d',' -f1 | tr '[:upper:]' '[:lower:]' | tr -d ' ')

if [[ "$FIRST_WORD" =~ ^(domain|url|host|ip|target|address|site)$ ]]; then
    echo "Detected header: $FIRST_LINE"
    HAS_HEADER=true
    START_LINE=2
else
    HAS_HEADER=false
    START_LINE=1
fi

# Calculate number of files
NUM_FILES=$(( (TOTAL_LINES + CHUNK_SIZE - 1) / CHUNK_SIZE ))
echo "Splitting into $NUM_FILES files with $CHUNK_SIZE domains each..."

# Split the file
for ((i=0; i<NUM_FILES; i++)); do
    START=$((START_LINE + i * CHUNK_SIZE))
    END=$((START + CHUNK_SIZE - 1))
    OUTPUT_FILE="$OUTPUT_DIR/${BASE_NAME}_part_$(printf "%04d" $((i+1))).csv"
    
    # Write header (always "domain" for output)
    echo "domain" > "$OUTPUT_FILE"
    
    # Extract chunk and get only domain (second column), skip numbers
    # Use awk to handle CSV properly: if line has comma, take second field, else take first field
    sed -n "${START},${END}p" "$INPUT_FILE" | awk -F',' '{
        if (NF >= 2) {
            # Format: number,domain - take second column onwards (handles domains with commas)
            domain = $2
            for (i=3; i<=NF; i++) {
                domain = domain "," $i
            }
            # Remove leading/trailing whitespace
            gsub(/^[ \t]+|[ \t]+$/, "", domain)
            # Only output if not empty and not just a number
            if (domain != "" && domain !~ /^[0-9]+$/) {
                print domain
            }
        } else if (NF == 1) {
            # Single column format - use as is if not a number
            domain = $1
            gsub(/^[ \t]+|[ \t]+$/, "", domain)
            if (domain != "" && domain !~ /^[0-9]+$/) {
                print domain
            }
        }
    }' >> "$OUTPUT_FILE"
    
    LINES_IN_FILE=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')
    if [ "$HAS_HEADER" = true ]; then
        LINES_IN_FILE=$((LINES_IN_FILE - 1))
    fi
    
    echo "Created: $(basename "$OUTPUT_FILE") ($LINES_IN_FILE domains)"
done

echo ""
echo "✓ Split complete! Created $NUM_FILES files in $OUTPUT_DIR"
