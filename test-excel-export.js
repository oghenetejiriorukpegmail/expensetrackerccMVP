// Test script for excel-generator.js Netlify function
const fs = require('fs');
const path = require('path');
const { handler } = require('./netlify/functions/excel-generator');

// Mock Supabase response with test data
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => {
      return {
        from: jest.fn((table) => {
          // Mock different responses based on the table
          if (table === 'trips') {
            return {
              select: jest.fn(() => {
                return {
                  eq: jest.fn(() => {
                    return {
                      single: jest.fn(() => {
                        return {
                          data: {
                            id: 'trip-123',
                            name: 'Test Business Trip',
                            description: 'Trip to client meeting',
                            status: 'Completed',
                            start_date: '2023-04-01',
                            end_date: '2023-04-05',
                            location: 'New York',
                            user_id: 'user-123'
                          },
                          error: null
                        };
                      })
                    };
                  }),
                  in: jest.fn(() => {
                    return {
                      data: [
                        { id: 'trip-123', name: 'Test Business Trip' }
                      ],
                      error: null
                    };
                  })
                };
              })
            };
          } else if (table === 'expenses') {
            return {
              select: jest.fn(() => {
                return {
                  eq: jest.fn(() => {
                    return {
                      data: [
                        {
                          id: 'expense-1',
                          date: '2023-04-01',
                          expense_type: 'Meals',
                          vendor: 'Restaurant ABC',
                          description: 'Dinner with client',
                          amount: '85.75',
                          currency: 'USD',
                          location: 'New York',
                          trip_id: 'trip-123',
                          user_id: 'user-123'
                        },
                        {
                          id: 'expense-2',
                          date: '2023-04-02',
                          expense_type: 'Transportation',
                          vendor: 'Taxi Service',
                          description: 'Taxi to meeting',
                          amount: '28.50',
                          currency: 'USD',
                          location: 'New York',
                          trip_id: 'trip-123',
                          user_id: 'user-123'
                        }
                      ],
                      error: null
                    };
                  }),
                  gte: jest.fn(() => {
                    return {
                      lte: jest.fn(() => {
                        return {
                          data: [
                            {
                              id: 'expense-1',
                              date: '2023-04-01',
                              expense_type: 'Meals',
                              vendor: 'Restaurant ABC',
                              description: 'Dinner with client',
                              amount: '85.75',
                              currency: 'USD',
                              location: 'New York',
                              trip_id: 'trip-123',
                              user_id: 'user-123'
                            }
                          ],
                          error: null
                        };
                      })
                    };
                  })
                };
              })
            };
          } else if (table === 'mileage_records') {
            return {
              select: jest.fn(() => {
                return {
                  eq: jest.fn(() => {
                    return {
                      data: [
                        {
                          id: 'mileage-1',
                          date: '2023-04-02',
                          start_odometer: '10000',
                          end_odometer: '10075',
                          distance: '75',
                          purpose: 'Drive to client meeting',
                          trip_id: 'trip-123',
                          user_id: 'user-123'
                        }
                      ],
                      error: null
                    };
                  }),
                  gte: jest.fn(() => {
                    return {
                      lte: jest.fn(() => {
                        return {
                          data: [
                            {
                              id: 'mileage-1',
                              date: '2023-04-02',
                              start_odometer: '10000',
                              end_odometer: '10075',
                              distance: '75',
                              purpose: 'Drive to client meeting',
                              trip_id: 'trip-123',
                              user_id: 'user-123'
                            }
                          ],
                          error: null
                        };
                      })
                    };
                  })
                };
              })
            };
          }
        }),
        storage: {
          from: jest.fn(() => {
            return {
              download: jest.fn(() => {
                return { data: null, error: new Error('Template not found') };
              })
            };
          })
        }
      };
    })
  };
});

// Set mock environment variables
process.env.SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'mock-service-key';

async function testExcelGenerator() {
  console.log('Testing excel-generator.js with tripId...');
  
  // Create mock event with tripId
  const mockEventWithTripId = {
    httpMethod: 'POST',
    body: JSON.stringify({
      tripId: 'trip-123'
    })
  };

  // Create mock context
  const mockContext = {};

  try {
    // Call the handler function with the mock event and context
    const response = await handler(mockEventWithTripId, mockContext);
    
    console.log('Response status code:', response.statusCode);
    console.log('Response headers:', response.headers);
    console.log('Is response base64 encoded:', response.isBase64Encoded);
    
    if (response.statusCode === 200) {
      // Save the Excel file to disk for inspection
      const buffer = Buffer.from(response.body, 'base64');
      const outputPath = path.join(__dirname, 'test-excel-output-trip.xlsx');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Excel file saved to: ${outputPath}`);
    } else {
      console.error('Error response:', response.body);
    }

    console.log('\nTesting excel-generator.js with date range...');
    
    // Create mock event with date range
    const mockEventWithDateRange = {
      httpMethod: 'POST',
      body: JSON.stringify({
        startDate: '2023-04-01',
        endDate: '2023-04-10'
      })
    };

    // Call the handler function with the date range mock event
    const dateRangeResponse = await handler(mockEventWithDateRange, mockContext);
    
    console.log('Response status code:', dateRangeResponse.statusCode);
    
    if (dateRangeResponse.statusCode === 200) {
      // Save the Excel file to disk for inspection
      const buffer = Buffer.from(dateRangeResponse.body, 'base64');
      const outputPath = path.join(__dirname, 'test-excel-output-date-range.xlsx');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Excel file saved to: ${outputPath}`);
    } else {
      console.error('Error response:', dateRangeResponse.body);
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testExcelGenerator();