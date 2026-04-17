import json

try:
    # Try to find the JSON array bracket manually to skip npm output
    with open('lint.json', 'r') as f:
        data = f.read()
    
    start_idx = data.find('[')
    end_idx = data.rfind(']') + 1
    
    if start_idx != -1 and end_idx != 0:
        json_str = data[start_idx:end_idx]
        parsed = json.loads(json_str)
        
        for item in parsed:
            if item.get('errorCount', 0) > 0:
                print(item['filePath'])
                for msg in item['messages']:
                    if msg['severity'] == 2:
                        print(f"  Line {msg['line']}: {msg['message']}")
except Exception as e:
    print(e)
