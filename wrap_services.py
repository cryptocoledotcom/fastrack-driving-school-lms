#!/usr/bin/env python3
import re
import os

# This script wraps remaining functions with executeService for Phase 1 completion

def wrap_function(func_text, func_name, service_name):
    """Wrap an async function with executeService"""
    # Match: export const funcName = async (...) => {
    pattern = r'(export\s+const\s+' + re.escape(func_name) + r'\s*=\s*async\s*\([^)]*\)\s*=>\s*\{)'
    match = re.search(pattern, func_text)
    if not match:
        return func_text
    
    # Find the try block and extract validation/logic
    try_pattern = r'try\s*\{(.*?)\}\s*catch\s*\(error\)\s*\{.*?\}'
    try_match = re.search(try_pattern, func_text, re.DOTALL)
    
    if try_match:
        logic = try_match.group(1).strip()
        # Remove console.error and throw error lines
        logic = re.sub(r'\s*console\.error\([^)]*\);?\s*', '', logic)
        logic = re.sub(r'\s*throw error;?\s*', '', logic)
        
        wrapped = f'''export const {func_name} = async (...) => {{
  return executeService(async () => {{{logic}
  }}, '{func_name}');
}};'''
        return wrapped
    
    return func_text

# Services and their import statements
services_to_update = {
    'courseServices.js': {
        'error_class': 'CourseError',
        'validators': ['validateCourseId', 'validateCourseData'],
        'imports_added': True
    },
    'lessonServices.js': {
        'error_class': 'LessonError',
        'validators': ['validateLessonData'],
        'imports_added': False
    },
    'pvqServices.js': {
        'error_class': 'PVQError',
        'validators': ['validatePVQData'],
        'imports_added': False
    },
    'schedulingServices.js': {
        'error_class': 'SchedulingError',
        'validators': ['validateTimeSlotData'],
        'imports_added': False
    },
    'securityServices.js': {
        'error_class': 'SecurityError',
        'validators': [],
        'imports_added': False
    },
}

print("Services wrapping script created. Manual wrapping needed due to complexity.")
print("Remaining services to wrap (all functions):")
print("- courseServices: 9 functions")
print("- lessonServices: 11 functions")  
print("- pvqServices: 7 functions")
print("- schedulingServices: 9 functions")
print("- securityServices: 8 functions")
print("- complianceServices: ~14 remaining")
print("- progressServices: 11 remaining")
print("- quizServices: ~11 remaining")
print("- enrollmentServices: ~15 remaining")
print("- paymentServices: ~9 remaining")
print("\nTotal remaining: ~104 functions")
