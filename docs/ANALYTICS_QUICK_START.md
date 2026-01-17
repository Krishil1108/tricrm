#!/bin/bash

# Analytics Dashboard Quick Start Script
echo "🚀 Starting TriCRM Analytics Dashboard Setup..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Install any missing dependencies
echo "📦 Checking dependencies..."
npm install

# Check if analytics components exist
if [ ! -f "src/AnalyticsDashboard.js" ]; then
    echo "❌ Error: Analytics Dashboard component not found"
    exit 1
fi

if [ ! -d "src/components/analytics" ]; then
    echo "❌ Error: Analytics components directory not found"
    exit 1
fi

echo "✅ Analytics Dashboard components found"

# Create a quick test endpoint for development
echo "🔧 Setting up development configuration..."

# Check if backend is running
curl -s http://localhost:5000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend server is running"
else
    echo "⚠️  Warning: Backend server is not running"
    echo "   Please start the backend server before testing analytics"
fi

echo ""
echo "🎯 Analytics Dashboard Setup Complete!"
echo ""
echo "📊 Available Features:"
echo "   • Summary Cards with KPIs"
echo "   • Client Analytics (Growth, Billing, Status, Profit)"
echo "   • Associate Analytics (Onboarding, Allocation, Earnings, Performance)"
echo "   • Project Analytics (Creation, Status, Budget, Workload)"
echo "   • Payment Analytics (Project, Client, Associate payments)"
echo "   • Profit Margin Analysis"
echo "   • Percentage Configuration Charts"
echo "   • Cross-comparison Analytics"
echo "   • Interactive Filters (Date, Client, Project, Associate, Status)"
echo "   • Export functionality (PNG, PDF, Excel)"
echo "   • Drill-down capabilities"
echo "   • Responsive design"
echo ""
echo "🌐 To access Analytics Dashboard:"
echo "   1. Start the frontend: npm start"
echo "   2. Navigate to: http://localhost:3000/analytics"
echo "   3. Use the sidebar menu to access Analytics"
echo ""
echo "🔧 API Endpoints:"
echo "   • GET /api/analytics/dashboard - Main dashboard data"
echo "   • GET /api/analytics/filter-options/* - Filter options"
echo "   • GET /api/analytics/clients - Client analytics"
echo "   • GET /api/analytics/associates - Associate analytics"
echo "   • GET /api/analytics/projects - Project analytics"
echo "   • GET /api/analytics/payments - Payment analytics"
echo "   • GET /api/analytics/profit-margins - Profit margin analytics"
echo "   • GET /api/analytics/percentage-config - Percentage config analytics"
echo "   • GET /api/analytics/cross-comparisons - Cross-comparison analytics"
echo ""
echo "🎨 UI Features:"
echo "   • Modern, responsive design"
echo "   • Interactive charts with hover effects"
echo "   • Sticky filter bar"
echo "   • Loading skeletons"
echo "   • Export modal"
echo "   • Fullscreen mode"
echo "   • Chart click-through for drill-downs"
echo ""
echo "Ready to analyze your CRM data! 📈"