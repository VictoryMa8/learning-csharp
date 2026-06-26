from pathlib import Path
from pypdf import PdfReader, PdfWriter

def main() -> None:
    pdf_path = input("PDF file path: ").strip().strip('"').strip("'")
    path = Path(pdf_path)

    if not path.is_file():
        raise SystemExit(f"File not found: {path}")

    start = int(input("Start page (x): ").strip())
    end = int(input("End page (y): ").strip())

    reader = PdfReader(path)
    writer = PdfWriter()

    for page_num in range(start, end + 1):
        writer.add_page(reader.pages[page_num - 1])

    output_path = path.with_name(f"{path.stem}_pages_{start}-{end}{path.suffix}")
    with output_path.open("wb") as out_file:
        writer.write(out_file)

    print(f"Saved {end - start + 1} page(s) to {output_path}")


if __name__ == "__main__":
    main()