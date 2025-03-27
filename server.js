// Required packages
const express = require('express');
const bodyParser = require('body-parser');
const TurndownService = require('turndown');
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize Turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '_'
});

// Customize turndown options
turndownService.addRule('preserveLineBreaks', {
  filter: 'br',
  replacement: function() {
    return '\n';
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST'],
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Body parsing middleware
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  logger.debug('Health check requested');
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// HTML to Markdown conversion endpoint
app.post('/api/convert', (req, res) => {
  try {
    const { html } = req.body;

    if (!html) {
      logger.warn('Conversion request received without HTML content');
      return res.status(400).json({ 
        success: false, 
        error: 'HTML content is required in the request body'
      });
    }
    
    // Check content size
    if (html.length > 1000000) { // ~1MB limit
      logger.warn('Conversion request received with oversized content', {
        contentLength: html.length
      });
      return res.status(413).json({
        success: false,
        error: 'HTML content too large'
      });
    }

    // Sanitize HTML before conversion
    const sanitizeOptions = {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span', 'img'
      ],
      allowedAttributes: {
        'a': ['href', 'name', 'target'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        '*': ['style', 'class']
      },
      // Disable script contents and dangerous attributes
      disallowedTagsMode: 'discard',
      allowedSchemes: ['http', 'https', 'mailto'],
      allowedSchemesByTag: {},
      allowedSchemesAppliedToAttributes: ['href', 'src'],
      allowProtocolRelative: false
    };
    
    const sanitizedHtml = sanitizeHtml(html, sanitizeOptions);
    
    // Check if sanitization removed too much content
    if (sanitizedHtml.length < (html.length * 0.5) && html.length > 100) {
      logger.warn('Significant content removed during sanitization', {
        originalLength: html.length,
        sanitizedLength: sanitizedHtml.length
      });
    }

    // Convert sanitized HTML to Markdown
    const markdown = turndownService.turndown(sanitizedHtml);

    logger.info('HTML successfully converted to Markdown', {
      originalLength: html.length,
      markdownLength: markdown.length
    });

    // Return the converted markdown
    return res.status(200).json({
      success: true,
      markdown: markdown
    });
  } catch (error) {
    logger.error('Conversion error occurred', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to convert HTML to Markdown',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message
  });
});

// Start the server
app.listen(port, () => {
  logger.info(`HTML to Markdown conversion service running on port ${port}`);
});

// Export for testing purposes
module.exports = app;