#!/usr/bin/env python3
"""
Split CSV file containing domains into multiple files with 500 domains each.
"""

import csv
import os
from pathlib import Path

def split_csv(input_file, output_dir, chunk_size=500):
    """
    Split a CSV file into multiple files with specified chunk size.
    
    Args:
        input_file: Path to input CSV file
        output_dir: Directory to save split files
        chunk_size: Number of domains per file (default: 500)
    """
    input_path = Path(input_file)
    output_path = Path(output_dir)
    
    # Create output directory if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Get base filename without extension
    base_name = input_path.stem
    
    # Read and process CSV
    domains = []
    header = None
    
    print(f"Reading {input_file}...")
    
    with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
        # Try to detect if first row is header
        reader = csv.reader(f)
        first_row = next(reader, None)
        
        if first_row:
            # Check if first row looks like a header
            first_cell = first_row[0].lower().strip() if first_row else ''
            header_keywords = ['domain', 'url', 'host', 'ip', 'target', 'address', 'site']
            
            if first_cell in header_keywords:
                header = first_row
                print(f"Detected header: {header}")
            else:
                # First row is data - check if it has number,domain format
                if len(first_row) >= 2:
                    # Format: number,domain - take second column
                    domain = first_row[1].strip()
                elif len(first_row) == 1:
                    # Format: domain only - take first column
                    domain = first_row[0].strip()
                else:
                    domain = ''
                
                # Skip if it's just a number or empty
                if domain and not domain.isdigit() and domain.lower() not in header_keywords:
                    domains.append(domain)
        
        # Read remaining rows
        for row in reader:
            if row and len(row) > 0:
                # Check if format is number,domain (has comma-separated values)
                if len(row) >= 2:
                    # Format: number,domain - take second column (domain)
                    domain = row[1].strip()
                elif len(row) == 1:
                    # Format: domain only - take first column
                    domain = row[0].strip()
                else:
                    domain = ''
                
                # Skip if it's just a number, empty, or header keyword
                if domain and not domain.isdigit() and domain.lower() not in header_keywords:
                    domains.append(domain)
    
    total_domains = len(domains)
    print(f"Found {total_domains} domains")
    
    if total_domains == 0:
        print("No domains found in file. Please check the file format.")
        return
    
    # Calculate number of files needed
    num_files = (total_domains + chunk_size - 1) // chunk_size
    print(f"Splitting into {num_files} files with {chunk_size} domains each...")
    
    # Split and write files
    for i in range(num_files):
        start_idx = i * chunk_size
        end_idx = min(start_idx + chunk_size, total_domains)
        chunk = domains[start_idx:end_idx]
        
        output_file = output_path / f"{base_name}_part_{i+1:04d}.csv"
        
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            # Always write "domain" as header (clean output format)
            writer.writerow(['domain'])
            # Write domains (only domain names, no numbers)
            for domain in chunk:
                writer.writerow([domain])
        
        print(f"Created: {output_file.name} ({len(chunk)} domains)")
    
    print(f"\n✓ Split complete! Created {num_files} files in {output_dir}")

if __name__ == '__main__':
    import sys
    
    input_file = 'top-1m.csv'
    output_dir = 'split'
    chunk_size = 500
    
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_dir = sys.argv[2]
    if len(sys.argv) > 3:
        chunk_size = int(sys.argv[3])
    
    split_csv(input_file, output_dir, chunk_size)
