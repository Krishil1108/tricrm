#!/usr/bin/env python3
"""
Python-based Chart Generation Service for TriCRM Analytics
Provides advanced chart generation capabilities using matplotlib and pandas
"""

import sys
import json
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import base64
from io import BytesIO

# Set style for better-looking charts
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

def generate_chart(chart_config):
    """
    Generate chart based on configuration
    Returns base64 encoded image
    """
    try:
        # Parse input data
        labels = chart_config.get('labels', [])
        values = chart_config.get('values', [])
        chart_type = chart_config.get('chartType', 'bar')
        title = chart_config.get('title', 'Analytics Chart')
        x_label = chart_config.get('xLabel', 'Categories')
        y_label = chart_config.get('yLabel', 'Values')
        
        # Create figure
        fig, ax = plt.subplots(figsize=(12, 8))
        
        if chart_type == 'bar':
            bars = ax.bar(labels, values, alpha=0.7)
            # Add value labels on bars
            for bar, value in zip(bars, values):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height + max(values)*0.01,
                       f'{value:,.0f}', ha='center', va='bottom')
                
        elif chart_type == 'line':
            ax.plot(labels, values, marker='o', linewidth=2, markersize=6)
            # Add value labels on points
            for i, (label, value) in enumerate(zip(labels, values)):
                ax.annotate(f'{value:,.0f}', (i, value), textcoords="offset points", 
                           xytext=(0,10), ha='center')
                
        elif chart_type == 'pie':
            # Filter out zero values for pie chart
            non_zero_data = [(label, value) for label, value in zip(labels, values) if value > 0]
            if non_zero_data:
                labels_filtered, values_filtered = zip(*non_zero_data)
                wedges, texts, autotexts = ax.pie(values_filtered, labels=labels_filtered, 
                                                 autopct='%1.1f%%', startangle=90)
                # Improve text visibility
                for autotext in autotexts:
                    autotext.set_color('white')
                    autotext.set_weight('bold')
            else:
                ax.text(0.5, 0.5, 'No Data Available', ha='center', va='center',
                       transform=ax.transAxes, fontsize=16)
                
        elif chart_type == 'doughnut':
            # Filter out zero values
            non_zero_data = [(label, value) for label, value in zip(labels, values) if value > 0]
            if non_zero_data:
                labels_filtered, values_filtered = zip(*non_zero_data)
                wedges, texts, autotexts = ax.pie(values_filtered, labels=labels_filtered,
                                                 autopct='%1.1f%%', startangle=90,
                                                 wedgeprops=dict(width=0.5))
                # Improve text visibility
                for autotext in autotexts:
                    autotext.set_color('white')
                    autotext.set_weight('bold')
            else:
                ax.text(0.5, 0.5, 'No Data Available', ha='center', va='center',
                       transform=ax.transAxes, fontsize=16)
        
        # Customize chart appearance
        ax.set_title(title, fontsize=16, fontweight='bold', pad=20)
        
        if chart_type not in ['pie', 'doughnut']:
            ax.set_xlabel(x_label, fontsize=12, fontweight='bold')
            ax.set_ylabel(y_label, fontsize=12, fontweight='bold')
            
            # Rotate x-axis labels if they're too long
            if any(len(str(label)) > 10 for label in labels):
                plt.xticks(rotation=45, ha='right')
                
            # Format y-axis for currency/numbers
            if 'revenue' in y_label.lower() or 'amount' in y_label.lower() or 'paid' in y_label.lower():
                ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
            else:
                ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:,.0f}'))
        
        # Improve layout
        plt.tight_layout()
        
        # Convert to base64
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close(fig)
        
        return {
            'success': True,
            'image': f"data:image/png;base64,{image_base64}",
            'message': 'Chart generated successfully'
        }
        
    except Exception as e:
        plt.close('all')
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to generate chart'
        }

def generate_advanced_analytics(data_config):
    """
    Generate advanced analytics insights using pandas and statistical analysis
    """
    try:
        # This could be extended for more complex analytics
        # like correlation analysis, trend detection, etc.
        
        labels = data_config.get('labels', [])
        values = data_config.get('values', [])
        
        if not labels or not values:
            return {'error': 'No data provided'}
        
        # Create DataFrame for analysis
        df = pd.DataFrame({'category': labels, 'value': values})
        
        # Basic statistics
        stats = {
            'total': df['value'].sum(),
            'average': df['value'].mean(),
            'median': df['value'].median(),
            'max': df['value'].max(),
            'min': df['value'].min(),
            'std_dev': df['value'].std()
        }
        
        # Find top performers
        top_3 = df.nlargest(3, 'value')[['category', 'value']].to_dict('records')
        
        # Calculate percentage distribution
        total = df['value'].sum()
        df['percentage'] = (df['value'] / total * 100) if total > 0 else 0
        
        insights = {
            'statistics': stats,
            'top_performers': top_3,
            'distribution': df[['category', 'percentage']].to_dict('records'),
            'summary': f"Total: {stats['total']:,.0f}, Average: {stats['average']:.1f}"
        }
        
        return {
            'success': True,
            'insights': insights,
            'message': 'Analytics generated successfully'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to generate analytics'
        }

if __name__ == '__main__':
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        operation = input_data.get('operation', 'chart')
        
        if operation == 'chart':
            result = generate_chart(input_data)
        elif operation == 'analytics':
            result = generate_advanced_analytics(input_data)
        else:
            result = {'success': False, 'error': 'Unknown operation'}
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'message': 'Failed to process request'
        }
        print(json.dumps(error_result))
        sys.exit(1)