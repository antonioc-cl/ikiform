// Debug script to check the form issue
// This can be run in browser console on the form page

console.log('=== FORM DEBUG ANALYSIS ===');

// Check if the form data is available in the page
const checkFormData = () => {
  console.log('1. Checking page elements...');
  
  // Check if form elements exist
  const formElements = document.querySelectorAll('form');
  console.log(`Found ${formElements.length} form elements`);
  
  const inputElements = document.querySelectorAll('input, textarea, select');
  console.log(`Found ${inputElements.length} input elements`);
  
  // Check for error messages or loading states
  const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
  console.log(`Found ${errorElements.length} error elements`);
  
  // Check for loading/skeleton elements
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="skeleton"], [class*="Loading"]');
  console.log(`Found ${loadingElements.length} loading elements`);
  
  // Check for form title
  const titleElements = document.querySelectorAll('h1, h2, h3');
  console.log('Form titles found:', Array.from(titleElements).map(el => el.textContent).filter(Boolean));
  
  // Check React error boundary or hydration issues
  const reactErrors = window.__REACT_ERROR_BOUNDARY_ERRORS__ || [];
  console.log('React errors:', reactErrors);
  
  return {
    formElements: formElements.length,
    inputElements: inputElements.length,
    errorElements: errorElements.length,
    loadingElements: loadingElements.length,
    hasContent: document.body.textContent.trim().length > 0
  };
};

// Check network requests
const checkNetworkRequests = () => {
  console.log('2. Checking network requests...');
  console.log('Open DevTools Network tab and refresh to see if:');
  console.log('- Form data is being fetched');
  console.log('- Any 404/500 errors occur');
  console.log('- API calls are failing');
};

// Check console errors
const checkConsoleErrors = () => {
  console.log('3. Checking for console errors...');
  console.log('Look for JavaScript errors in console that might prevent form rendering');
};

// Run analysis
const analysis = checkFormData();
console.log('Analysis results:', analysis);

checkNetworkRequests();
checkConsoleErrors();

// Potential issues to check:
console.log('\n=== POTENTIAL ISSUES TO CHECK ===');
console.log('1. Form schema might be empty or invalid');
console.log('2. Database query might be failing');
console.log('3. Form might not be properly published');
console.log('4. Loading timeout might be preventing display');
console.log('5. JavaScript errors preventing React hydration');
console.log('6. CSS issues hiding the form content');

console.log('\n=== NEXT STEPS ===');
console.log('1. Check Network tab for failed API calls');
console.log('2. Check Console for JavaScript errors');  
console.log('3. Inspect the form element structure');
console.log('4. Verify form is published in database');