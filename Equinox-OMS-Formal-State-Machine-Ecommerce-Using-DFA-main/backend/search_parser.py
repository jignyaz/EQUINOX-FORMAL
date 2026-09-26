import re
from typing import List, Dict, Any

class Token:
    def __init__(self, type_: str, value: str):
        self.type = type_
        self.value = value

    def __repr__(self):
        return f"Token({self.type}, {self.value})"

class LexicalScanner:
    """
    Scans a search query string and tokenizes it into distinct parts for advanced product filtering.
    Tokens:
    - CATEGORY: cat:electronics
    - PRICE_RANGE: price<50 or price>100
    - KEYWORD: any other text
    """
    
    # Regex patterns for advanced tokens
    PATTERNS = [
        (r'cat:([a-zA-Z0-9_-]+)', 'CATEGORY'),
        (r'price([<>=]+)([0-9]+(?:\.[0-9]+)?)', 'PRICE_COND'),
        (r'tag:([a-zA-Z0-9_-]+)', 'TAG'),
        (r'[a-zA-Z0-9]+', 'KEYWORD')
    ]

    def tokenize(self, query: str) -> List[Token]:
        tokens = []
        # Split by spaces but respect quotes in the future (simple split for now)
        parts = query.split()
        
        for part in parts:
            matched = False
            for pattern, type_ in self.PATTERNS:
                match = re.match(pattern, part)
                if match:
                    if type_ == 'PRICE_COND':
                        # Stores Operator and Value, e.g., Token("PRICE_COND", {"op": "<", "val": 50})
                        op, val = match.groups()
                        tokens.append(Token(type_, {"op": op, "val": float(val)}))
                    elif type_ in ['CATEGORY', 'TAG']:
                        tokens.append(Token(type_, match.group(1)))
                    else:
                        tokens.append(Token(type_, match.group(0)))
                    matched = True
                    break
            
            if not matched:
                # Fallback token
                tokens.append(Token("KEYWORD", part))
                
        return tokens

class SearchParser:
    """
    Parses the tokens into an abstract syntax tree / SQLAlchemy filter dict.
    """
    def __init__(self):
        self.scanner = LexicalScanner()

    def parse(self, query: str) -> Dict[str, Any]:
        tokens = self.scanner.tokenize(query)
        
        parsed = {
            "keywords": [],
            "category": None,
            "tags": [],
            "price_conds": []
        }
        
        for token in tokens:
            if token.type == "KEYWORD":
                parsed["keywords"].append(token.value)
            elif token.type == "CATEGORY":
                parsed["category"] = token.value
            elif token.type == "TAG":
                parsed["tags"].append(token.value)
            elif token.type == "PRICE_COND":
                parsed["price_conds"].append(token.value)
                
        return parsed

# Quick Test (when executed directly)
if __name__ == "__main__":
    parser = SearchParser()
    res = parser.parse("macbook cat:electronics price<1500 tag:New")
    print(res)
