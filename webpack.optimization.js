/**
 * Webpack Optimization Configuration
 * Performance optimizations for the modern design system
 */

const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  // Code splitting configuration
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        // Design system components
        designSystem: {
          test: /[\\/]src[\\/]components[\\/]/,
          name: 'design-system',
          chunks: 'all',
          priority: 5,
          minSize: 10000
        },
        // Utilities
        utils: {
          test: /[\\/]src[\\/]utils[\\/]/,
          name: 'utils',
          chunks: 'all',
          priority: 3,
          minSize: 5000
        },
        // CSS
        styles: {
          test: /\.css$/,
          name: 'styles',
          chunks: 'all',
          priority: 1,
          enforce: true
        }
      }
    },
    // Runtime chunk
    runtimeChunk: {
      name: 'runtime'
    },
    // Minimize configuration
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      // Terser for JS minification
      new (require('terser-webpack-plugin'))({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production',
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info']
          },
          mangle: {
            safari10: true
          },
          format: {
            comments: false
          }
        },
        extractComments: false
      }),
      // CSS optimization
      new (require('css-minimizer-webpack-plugin'))({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              colormin: true,
              convertValues: true,
              discardDuplicates: true,
              discardEmpty: true,
              mergeRules: true,
              minifyFontValues: true,
              minifySelectors: true
            }
          ]
        }
      })
    ]
  },

  // Performance budgets
  performance: {
    maxAssetSize: 250000, // 250KB
    maxEntrypointSize: 400000, // 400KB
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false
  },

  // Plugins for optimization
  plugins: [
    // Bundle analyzer (only in development)
    ...(process.env.ANALYZE_BUNDLE ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        openAnalyzer: true,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json'
      })
    ] : []),

    // Compression plugin for production
    ...(process.env.NODE_ENV === 'production' ? [
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8
      })
    ] : []),

    // Preload plugin for critical resources
    new (require('@vue/preload-webpack-plugin'))({
      rel: 'preload',
      include: 'initial',
      fileBlacklist: [/\.map$/, /hot-update\.js$/]
    }),

    // Prefetch plugin for non-critical resources
    new (require('@vue/preload-webpack-plugin'))({
      rel: 'prefetch',
      include: 'asyncChunks'
    })
  ],

  // Module resolution optimization
  resolve: {
    // Reduce resolve time
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    // Alias for common paths
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@styles': path.resolve(__dirname, 'src/styles')
    },
    // Extensions to try
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    // Symlinks
    symlinks: false
  },

  // Module rules for optimization
  module: {
    rules: [
      // JavaScript/TypeScript optimization
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              cacheCompression: false,
              presets: [
                ['@babel/preset-env', {
                  useBuiltIns: 'usage',
                  corejs: 3,
                  modules: false
                }],
                '@babel/preset-react'
              ],
              plugins: [
                // Tree shaking for lodash
                'lodash',
                // Dynamic imports
                '@babel/plugin-syntax-dynamic-import',
                // Remove prop-types in production
                ...(process.env.NODE_ENV === 'production' ? [
                  'transform-react-remove-prop-types'
                ] : [])
              ]
            }
          }
        ]
      },

      // CSS optimization
      {
        test: /\.css$/,
        use: [
          process.env.NODE_ENV === 'production' 
            ? require('mini-css-extract-plugin').loader 
            : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                auto: true,
                localIdentName: process.env.NODE_ENV === 'production' 
                  ? '[hash:base64:5]' 
                  : '[name]__[local]--[hash:base64:5]'
              }
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'tailwindcss',
                  'autoprefixer',
                  ...(process.env.NODE_ENV === 'production' ? [
                    ['cssnano', {
                      preset: ['default', {
                        discardComments: { removeAll: true },
                        normalizeWhitespace: true
                      }]
                    }]
                  ] : [])
                ]
              }
            }
          }
        ]
      },

      // Image optimization
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8192 // 8KB
          }
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        },
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 80
              },
              optipng: {
                enabled: false
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4
              },
              gifsicle: {
                interlaced: false
              },
              webp: {
                quality: 80
              }
            }
          }
        ]
      },

      // Font optimization
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]'
        }
      }
    ]
  },

  // Cache configuration
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  },

  // Development server optimization
  devServer: {
    compress: true,
    hot: true,
    overlay: {
      warnings: false,
      errors: true
    }
  }
};