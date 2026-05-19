import PyPDF2
from pathlib import Path

class PDFProcessor:
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        """Extract text content from PDF file"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                
                return text.strip()
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return ""
    
    @staticmethod
    def extract_text_from_txt(txt_path: str) -> str:
        """Extract text from plain text file"""
        try:
            with open(txt_path, 'r', encoding='utf-8') as file:
                return file.read().strip()
        except Exception as e:
            print(f"Error reading text file: {e}")
            return ""