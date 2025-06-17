# THABI CRM System

## Overview

THABI CRM is a comprehensive Customer Relationship Management system designed specifically for candy/sweet distributors. The system provides complete business management capabilities including customer management, supplier tracking, product catalog, sales monitoring, expense tracking, and financial reporting. Built with Flask and using JSON-based data storage, the system offers a web-based interface with real-time dashboard analytics.

## System Architecture

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Data Storage**: JSON-based file system storage
- **Data Management**: Custom data manager classes for each entity type
- **Authentication**: Session-based with Flask's built-in session management
- **Deployment**: Gunicorn WSGI server with autoscale deployment

### Frontend Architecture
- **Template Engine**: Jinja2 (Flask's default)
- **CSS Framework**: Bootstrap 5.3.0 with custom dark theme
- **JavaScript**: Vanilla JavaScript with jQuery for enhanced functionality
- **Charts**: Chart.js for dashboard visualizations
- **Icons**: Font Awesome 6.0 for UI icons

### Data Model Structure
The system uses dataclass-based models for:
- **Cliente** (Customer): ID, name, store number, address, phone, email, notes
- **Fornecedor** (Supplier): ID, name, CNPJ, registration date
- **Produto** (Product): ID, name, purchase price, sale price, supplier ID
- **Venda** (Sale): ID, invoice number, date, customer, value, payment method, status
- **Despesa** (Expense): ID, description, value, category, date, supplier association

## Key Components

### Data Management Layer
- **DataManager**: Central data management class handling JSON file operations
- **Entity Managers**: Specialized classes for each business entity (customers, suppliers, products, sales, expenses)
- **Model Classes**: Dataclass-based models ensuring type safety and structure

### Web Interface Layer
- **Base Template**: Responsive layout with navigation and common UI elements
- **Dashboard**: Real-time metrics, charts, and key performance indicators
- **CRUD Interfaces**: Full create, read, update, delete functionality for all entities
- **Search & Filtering**: Advanced filtering capabilities across all data types

### Business Logic Layer
- **Margin Calculator**: Profit margin calculations and pricing tools
- **Report Generator**: Comprehensive reporting system with Excel export
- **Financial Analytics**: Revenue, expense, and profit analysis tools

### Configuration Management
- **Categories System**: Configurable expense categories
- **Application Settings**: Version control, backup settings, company information
- **Localization**: Brazilian Portuguese interface with proper currency formatting

## Data Flow

### Request Processing
1. HTTP requests routed through Flask application routes
2. Data validation and processing in respective manager classes
3. JSON file operations for data persistence
4. Response rendering through Jinja2 templates

### Data Storage Pattern
- Each entity type stored in separate JSON files
- Automatic ID generation and data validation
- Backup system with configurable intervals
- Data integrity checks and error handling

### User Interface Flow
- Dashboard provides overview with key metrics and charts
- Navigation through Bootstrap-based responsive interface
- Modal-based forms for data entry and editing
- Real-time filtering and search functionality

## External Dependencies

### Python Libraries
- **Flask 3.1.1**: Web application framework
- **Gunicorn 23.0.0**: WSGI HTTP server for deployment
- **Email-validator 2.2.0**: Email validation utilities
- **Flask-SQLAlchemy 3.1.1**: Database abstraction (future PostgreSQL integration)
- **psycopg2-binary 2.9.10**: PostgreSQL adapter (prepared for future use)

### Frontend Libraries
- **Bootstrap 5.3.0**: CSS framework and components
- **Chart.js**: JavaScript charting library
- **Font Awesome 6.0**: Icon library
- **jQuery 3.6.0**: JavaScript utility library

### System Dependencies
- **OpenSSL**: Secure communications
- **PostgreSQL**: Database system (configured but not yet implemented)

## Deployment Strategy

### Development Environment
- **Python 3.11**: Runtime environment
- **Nix Package Manager**: System package management
- **Replit Environment**: Cloud-based development platform

### Production Deployment
- **Gunicorn Server**: Production WSGI server
- **Autoscale Deployment**: Automatic scaling based on demand
- **Port Configuration**: Standard HTTP port 80 mapped from internal port 5000
- **Process Management**: Parallel workflow execution

### File Structure
```
/
├── app.py                 # Main Flask application
├── main.py               # Application entry point
├── data_manager.py       # Central data management
├── models.py             # Data model definitions
├── data/                 # JSON data storage
├── templates/            # HTML templates
├── static/               # CSS, JS, and assets
└── pyproject.toml        # Python dependencies
```

### Configuration Files
- **.replit**: Environment and deployment configuration
- **pyproject.toml**: Python project dependencies
- **uv.lock**: Dependency lock file for reproducible builds

## Changelog
- June 16, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.