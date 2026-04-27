import os
import re

files_to_fix = [
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Monitoring/WorkPrograms/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Monitoring/DailyReports/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Monitoring/AuditLog/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Monitoring/FinalReports/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Monitoring/QualityAudit/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Operational/Locations/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Operational/Groups/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Website/Rekapitulasi/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/System/KknRequirements/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Academic/GradeGenerator/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Academic/GradeReports/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Website/Announcements/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/Website/Downloads/Index.tsx",
    "/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin/DatabaseSync/Index.tsx"
]

for filepath in files_to_fix:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Using a much more flexible regex to catch the broken pattern
        # It looks for className="<div className=" followed by anything until ">"
        new_content = re.sub(r'className="<div className="(.+?)">"', r'className="\1">', content)
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Fixed: {filepath}")
        else:
            # Try an even simpler replacement for very broken cases
            new_content = content.replace('className="<div className="', 'className="')
            new_content = new_content.replace('">"', '">')
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Fixed (simple replace): {filepath}")
            else:
                print(f"Not Fixed: {filepath}")
    else:
        print(f"File not found: {filepath}")
