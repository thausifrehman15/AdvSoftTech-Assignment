import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, NgStyle } from '@angular/common';
import {
  ButtonDirective,
  AlertComponent,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ColDirective,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  GutterDirective,
  ListGroupModule,
  ListGroupDirective, 
  ListGroupItemDirective,
  NavComponent,
  NavItemComponent,
  NavLinkDirective,
  RowComponent,
  RowDirective,
  TableDirective,
  TextColorDirective,
  PaginationComponent,
  PageItemComponent,
  PageLinkDirective
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { IChartProps } from './dashboard-charts-data'; 
import { ChartData } from 'chart.js';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChartOptions } from 'chart.js';
import {   SAMPLE_PREDICTION_HISTORY,SAMPLE_CSV_FILES,SAMPLE_PENDING_FILES,SAMPLE_MY_FILES} from './datafiles';
import { PredictionService } from './prediction.service';
import { SubscriptionService } from '../../services/subscription.service';
import { filter, interval, Subscription, takeWhile } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { PredictionResponse } from './prediction.interface';

interface CsvFile {
  id: string;
  name: string;
  data: any[];
  chartData?: ChartData;
  isDefault?: boolean;
  status: string;
  timestamp: Date; 
}

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  imports: [
    CommonModule,
    PaginationComponent,
    PageItemComponent,
    PageLinkDirective,
    HttpClientModule,
    NavComponent,
    NavItemComponent,
    NavLinkDirective,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    ReactiveFormsModule,
    ChartjsComponent,
    CardHeaderComponent,
    TableDirective,
    RowComponent,
    ColComponent,
    ListGroupDirective,
    ListGroupItemDirective,
    FormsModule,
    FormDirective,
    FormLabelDirective,
    FormControlDirective,
    ButtonDirective,
    AlertComponent
  ],
})

export class DashboardComponent implements OnInit {
  private _cachedChartData: ChartData | null = null;
  private _lastPredictionTimeStamp: Date = new Date(); // Initialize with current date
  private selectedHistoryItem: any = null;
  private fileStatusSubscriptions = new Map<string, Subscription>();

  public activeTab = 'single';
  public activeCsvFile = ''; // Track active CSV file
  public mainChart: IChartProps = { type: 'line' };
  public mainChartRef: WritableSignal<any> = signal(undefined);
  public chart: Array<IChartProps> = [];
  public fileSearchQuery: string = '';
  public filteredFiles: CsvFile[] = [];
  public pageSize: number = 10;
  public currentPage: number = 0;
  public Math = Math; // Make Math available to the template
  public isProcessingSinglePrediction: boolean = false;
  public historyPageSize: number = 5;
  public historyCurrentPage: number = 0;
  public selectedCategories: any[] = [];
  public showCategoryModal: boolean = false;

  public lastSinglePrediction: PredictionResponse | null = null;
  // Pie chart options
  public pieChartOptions: ChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  options = {
    maintainAspectRatio: false,
  };


  // Add this inside your component class
  public pendingFiles: { id: string; name: string; timestamp: Date }[] = [];
  public myFiles: CsvFile[] = []; // This will store user's completed files
  public singlePredictionHistory: PredictionResponse[] = [];
  public isLoadingFile: boolean = false;
  public disableOtherMyFiles: boolean = false;
  public chartInitializationDelay = 1500; // Increased delay for chart initialization
  public isChartReady: boolean = false;
  public chartKey: string = ''; // Add this to force chart recreation

  constructor(
  private http: HttpClient,
  private predictionService: PredictionService,
  private subscriptionService: SubscriptionService, // Add this
  private cdr: ChangeDetectorRef,
  private route: ActivatedRoute,
  private router: Router
  ) {}

  private resetLoadingState(): void {
    this.isLoadingFile = false;
    this.disableOtherMyFiles = false;
    this.isChartReady = true;
    this.cdr.detectChanges();
  }

  get totalPages(): number {
    return this.currentCsvFile
      ? Math.ceil(this.currentCsvFile.data.length / this.pageSize)
      : 0;
  }

  public singlePredictionForm = new FormGroup({
    textInput: new FormControl('', { nonNullable: true }),
  });

  public predictionForm = new FormGroup({
    text: new FormControl('', { nonNullable: true }),
  });
  public isPredicting: boolean = false;

  public fileUploadForm = new FormGroup({
    csvFile: new FormControl<File | null>(null),
    fileName: new FormControl(''),
  });

  public csvFiles: CsvFile[] = []

  chartRadarData: ChartData = {
    labels: [
      'Very Positive',
      'Slightly Positive',
      'Neutral',
      'Slightly Negative',
      'Very Negative'
    ],
    datasets: [
      {
        label: 'Sentiment Distribution',
        backgroundColor: 'rgba(51, 153, 255, 0.2)',
        borderColor: 'rgba(51, 153, 255, 1)',
        pointBackgroundColor: 'rgba(51, 153, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(51, 153, 255, 1)',
        data: [92, 65, 30, 15, 8],
      },
      {
        label: 'Threshold',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
        data: [50, 50, 50, 50, 50],
      }
    ],
  };

  ngOnInit(): void {
    // 1. Get the initial activeTab from route data
    this.route.data.subscribe(data => {
      if (data['activeTab']) {
        this.activeTab = data['activeTab'];
        console.log('Active tab from route data:', this.activeTab);
      }
    });
    
    // 2. Update activeTab on URL changes without full reload
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const url = this.router.url;
      
      if (url.includes('/dashboard/bulk')) {
        this.activeTab = 'bulk';
      } else if (url.includes('/dashboard/single')) {
        this.activeTab = 'single';
      }
      
      // Force change detection to update UI without full reload
      this.cdr.detectChanges();
    });

    this.predictionService.getUserData().subscribe({
      next: (userData) => {
        this.singlePredictionHistory = userData.predictionHistory;
        this.pendingFiles = userData.pendingFiles;
        this.myFiles = userData.completedFiles;
        this.filteredFiles = this.myFiles;

        // Set active CSV file if any exist
        if (this.csvFiles.length > 0) {
          this.activeCsvFile = this.csvFiles[0].id;
        }

        // Set initial data for single prediction display
        if (this.singlePredictionHistory.length > 0) {
          this.lastSinglePrediction = { ...this.singlePredictionHistory[0] };
          this.selectedHistoryItem = this.singlePredictionHistory[0];
        }
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        // Fallback to sample data if API fails
        this.csvFiles = SAMPLE_CSV_FILES;
        this.singlePredictionHistory = SAMPLE_PREDICTION_HISTORY;
        this.pendingFiles = SAMPLE_PENDING_FILES;
        this.myFiles = SAMPLE_MY_FILES;
        this.filteredFiles = this.myFiles;

        if (this.singlePredictionHistory.length > 0) {
          this.lastSinglePrediction = { ...this.singlePredictionHistory[0] };
          this.selectedHistoryItem = this.singlePredictionHistory[0];
        }
      },
    });
  }

  showHistoryItemChart(prediction: any): void {
    this.selectedHistoryItem = prediction;

    // Update the current chart with this prediction's data
    this.lastSinglePrediction = {
      text: prediction.text,
      final_prediction: prediction.final_prediction,
      confidence: prediction.confidence,
      sentiment_scores: prediction.sentiment_scores,
      timestamp: prediction.timestamp,
    };

    // Clear the cache to force chart update
    this._cachedChartData = null;
  }

  isSelectedHistoryItem(prediction: any): boolean {
    return (
      this.selectedHistoryItem &&
      this.selectedHistoryItem.timestamp === prediction.timestamp
    );
  }

  filterFiles(): void {
    if (!this.fileSearchQuery) {
      this.filteredFiles = this.myFiles;
      return;
    }

    const query = this.fileSearchQuery.toLowerCase();
    this.filteredFiles = this.myFiles.filter((file) =>
      file.name.toLowerCase().includes(query)
    );
  }

  clearFileSearch(): void {
    this.fileSearchQuery = '';
    this.filterFiles();
  }

  selectCsvFile(fileId: string): void {
    // Prevent switching if loading
    if (this.isLoadingFile) {
      return;
    }

    // Additional check to prevent rapid switching
    if (!this.isChartReady && this.activeCsvFile) {
      return;
    }

    // Set loading state even for tab switching to existing files
    this.isLoadingFile = true;
    this.disableOtherMyFiles = true;
    this.isChartReady = false;

    this.activeCsvFile = fileId;
    this.currentPage = 0;
    this.chartKey = `${fileId}-${Date.now()}`; // Force chart recreation
    
    // Force change detection
    this.cdr.detectChanges();

    // Short delay to ensure chart properly switches
    setTimeout(() => {
      this.isLoadingFile = false;
      this.disableOtherMyFiles = false;
      this.isChartReady = true;
      this.cdr.detectChanges();
    }, 600);
  }

  get currentCsvFile(): CsvFile | undefined {
    return this.csvFiles.find((file) => file.id === this.activeCsvFile);
  }

  predictSingleText(): void {
    const textValue = this.singlePredictionForm.get('textInput')?.value;
    if (!textValue || textValue.trim() === '') {
      return;
    }
    
    this.isProcessingSinglePrediction = true;

    this.predictionService.predictText(textValue).subscribe({
      next: (response) => {
        try {
          // Handle both array and object formats for sentiment_scores
          let categories: {name: string, value: number}[] = [];
          
          if (Array.isArray(response.sentiment_scores)) {
            // If sentiment_scores is already an array
            categories = response.sentiment_scores.map(score => ({
              name: score.name === 'neutral' ? 'Neutral' : score.name,
              value: typeof score.value === 'number' ? score.value : 
                    Number((Number(score.value) * 100).toFixed(2))
            }));
          } else if (response.sentiment_scores && typeof response.sentiment_scores === 'object') {
            // If sentiment_scores is an object
            categories = Object.entries(response.sentiment_scores).map(
              ([name, value]) => ({
                name: name === 'neutral' ? 'Neutral' : name,
                value: Number((Number(value) * 100).toFixed(2)),
              })
            );
          }

          // Calculate confidence (highest score)
          let confidence = 0;
          if (response.final_prediction) {
            // Find the category matching the final prediction
            const matchingCategory = categories.find(
              c => c.name.toLowerCase() === response.final_prediction?.toLowerCase()
            );
            
            if (matchingCategory) {
              confidence = matchingCategory.value;
            } else if (categories.length > 0) {
              // If no match found, use highest score
              confidence = Math.max(...categories.map(c => c.value));
            }
          }

          const prediction = {
            text: textValue,
            final_prediction: response.final_prediction,
            confidence: confidence,
            sentiment_scores: categories,
            timestamp: new Date(),
          };

          // Save prediction to history
          this.predictionService.savePredictionToHistory(prediction);
          
          // // Update UI immediately without calling getUserData again
          // if (Array.isArray(this.singlePredictionHistory)) {
          //   this.singlePredictionHistory.unshift(prediction);
          // } else {
          //   this.singlePredictionHistory = [prediction];
          // }
          
          this.lastSinglePrediction = prediction;
          this.selectedHistoryItem = prediction;
          this.historyCurrentPage = 0;
          this._cachedChartData = null;
          this.singlePredictionForm.reset();
        } catch (err) {
          console.error('Error processing prediction result:', err);
          alert('Failed to process prediction result. Please try again.');
        } finally {
          this.isProcessingSinglePrediction = false;
        }
      },
      error: (error) => {
        console.error('[DEBUG] Error in predictSingleText:', error);
        this.isProcessingSinglePrediction = false;
        
        // More user-friendly error message
        if (error.status === 0) {
          alert('Network error. Please check your internet connection and try again.');
        } else if (error.status === 429) {
          alert('Too many requests. Please wait a moment and try again.');
        } else {
          alert(`Failed to process prediction: ${error.message || 'Unknown error'}`);
        }
      }
    });
  }
  
  /**
   * Removes a CSV file from the visualization
   * @param fileId The ID of the file to remove
   * @param event The click event (to prevent it from triggering the tab selection)
   */
  deleteCsvFile(fileId: string, event: Event): void {
    // Stop the event from propagating (to prevent tab selection)
    // Stop event propagation to prevent tab selection
    event.stopPropagation();

    // Find and remove the file
    const index = this.csvFiles.findIndex((file) => file.id === fileId);
    if (index !== -1) {
      this.csvFiles.splice(index, 1);

      // If we deleted the active file, select another one
      if (fileId === this.activeCsvFile && this.csvFiles.length > 0) {
        this.activeCsvFile = this.csvFiles[0].id;
      } else if (this.csvFiles.length === 0) {
        this.activeCsvFile = '';
      }
    }
  }

  // Method for file selection
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput?.files?.[0];
    fileInput.value = ''; // Reset input so same file can be uploaded again

    if (file) {
      this.fileUploadForm.patchValue({
        fileName: file.name,
        csvFile: file,
      });
    }
  }

  predictCsvFile(): void {
    const file = this.fileUploadForm.get('csvFile')?.value;

    if (!file) {
      alert('Please select a file first');
      return;
    }

    // Upload file for prediction
    this.predictionService.uploadCsvForPrediction(file).subscribe({
      next: (response) => {
        if (!response) {
          // Handle null response
          alert('Failed to upload file. Please try again.');
          return;
        }

        // Check if file already exists in pending files to avoid duplication
        const existingPendingFileIndex = this.pendingFiles.findIndex(
          (pf) => pf.id === response.fileId
        );
        if (existingPendingFileIndex === -1) {
          // Only add to pending files if it's not already there
          this.pendingFiles.push({
            id: response.fileId,
            name: response.name || file.name,
            timestamp: new Date(response.timestamp) || new Date(),
          });
        }

        // Reset form
        this.fileUploadForm.reset();

        // Start polling for status updates
        this.pollFileStatus(response.fileId);
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
      },
    });
  }

  loadFileToVisualization(fileId: string): void {
    // Prevent loading if another file is currently loading
    if (this.isLoadingFile) {
      return;
    }

    // Check if file already exists in visualization tabs
    const existingFileIndex = this.csvFiles.findIndex(
      (file) => file.id === fileId
    );

    if (existingFileIndex !== -1) {
      // File already exists in tabs, just activate it with proper loading state
      this.isLoadingFile = true;
      this.disableOtherMyFiles = true;
      this.isChartReady = false;
      
      // Set the active file and update chart key
      this.activeCsvFile = fileId;
      this.currentPage = 0;
      this.chartKey = `${fileId}-${Date.now()}`; // Force chart recreation
      
      // Wait for chart to properly initialize even for existing files
      setTimeout(() => {
        this.isLoadingFile = false;
        this.disableOtherMyFiles = false;
        this.isChartReady = true;
        this.cdr.detectChanges();
      }, 800); // Shorter delay for existing files
      
      return;
    }

    // Start loading state for new files
    this.isLoadingFile = true;
    this.disableOtherMyFiles = true;
    this.isChartReady = false;

    // Otherwise, fetch file details from API
    this.predictionService.getFileDetails(fileId).subscribe({
      next: (fileDetails) => {
        try {
          // Create chart data from the file details
          const chartData = this.generateChartDataFromApiResponse(fileDetails);

          // Add to visualization tabs
          const newFile: CsvFile = {
            id: fileId,
            name: fileDetails.name,
            status: 'completed',
            timestamp: new Date(fileDetails.timestamp),
            isDefault: false,
            data: fileDetails.data || [],
            chartData: chartData,
          };

          this.csvFiles.push(newFile);
          this.activeCsvFile = fileId;
          this.currentPage = 0;
          this.chartKey = `${fileId}-${Date.now()}`; // Force chart recreation

          // Force change detection first
          this.cdr.detectChanges();

          // Wait longer for chart to fully initialize for new files
          setTimeout(() => {
            this.isLoadingFile = false;
            this.disableOtherMyFiles = false;
            this.isChartReady = true;
            this.cdr.detectChanges();
          }, this.chartInitializationDelay);

        } catch (error) {
          console.error('Error processing file details:', error);
          this.resetLoadingState();
          alert('Failed to process file details. Please try again.');
        }
      },
      error: (error) => {
        console.error('Error loading file details:', error);
        this.resetLoadingState();
        alert('Failed to load file details. Please try again.');
      },
    });
  }

  // Chart data for single prediction
  get singlePredictionChartData(): ChartData {
    if (!this.lastSinglePrediction) {
      // Return a valid empty chart structure 
      return { 
        labels: [], 
        datasets: [{
          data: [],
          backgroundColor: []
        }]
      };
    }

    // Return cached data if prediction hasn't changed
    if (
      this._cachedChartData &&
      this._lastPredictionTimeStamp === this.lastSinglePrediction.timestamp
    ) {
      return this._cachedChartData;
    }

    // Generate new chart data
    const chartData: ChartData = {
      labels: this.lastSinglePrediction?.sentiment_scores?.map((c) => c.name) || [],
      datasets: [
        {
          data: this.lastSinglePrediction?.sentiment_scores?.map((c) => c.value) || [],
          backgroundColor: [
            'rgba(25, 135, 84, 0.8)', // Very Positive - green
            'rgba(13, 202, 240, 0.8)', // Slightly Positive - info blue
            'rgba(108, 117, 125, 0.8)', // Neutral - gray
            'rgba(255, 193, 7, 0.8)', // Slightly Negative - amber
            'rgba(220, 53, 69, 0.8)', // Very Negative - red
          ],
          borderWidth: 1,
        },
      ],
    };

    // Cache the data and timestamp
    this._cachedChartData = chartData;
    this._lastPredictionTimeStamp = this.lastSinglePrediction.timestamp || new Date();

    return chartData;
  }

  getPaginatedData(
    dataArray: any[],
    currentPage: number,
    pageSize: number
  ): any[] {
    if (!dataArray || !dataArray.length) return [];
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return dataArray.slice(start, end);
  }

  // Common method to get visible page numbers
  getVisiblePageNumbers(
    totalItems: number,
    pageSize: number,
    currentPage: number
  ): number[] {
    const totalPages = Math.ceil(totalItems / pageSize);
    const pages: number[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and pages around current
      pages.push(0); // First page

      if (currentPage > 2) {
        pages.push(-1); // Ellipsis
      }

      // Pages around current
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push(-1); // Ellipsis
      }

      if (totalPages > 1) {
        pages.push(totalPages - 1); // Last page
      }
    }

    return pages;
  }

  // Common method to change page
  changePage(page: number, target: 'bulk' | 'history'): void {
    if (target === 'bulk') {
      const totalPages = this.currentCsvFile
        ? Math.ceil(this.currentCsvFile.data.length / this.pageSize)
        : 0;

      if (page >= 0 && page < totalPages) {
        this.currentPage = page;
      }
    } else {
      const totalPages = Math.ceil(
        this.singlePredictionHistory.length / this.historyPageSize
      );

      if (page >= 0 && page < totalPages) {
        this.historyCurrentPage = page;
      }
    }
  }

  // Common method to handle page size changes
  onPageSizeChange(target: 'bulk' | 'history'): void {
    if (target === 'bulk') {
      this.currentPage = 0;
    } else {
      this.historyCurrentPage = 0;
    }
  }

  // Helper method to get color for category
  getCategoryColor(categoryName: string): string {
    const colorMap: Record<string, string> = {
      'Very Negative': 'rgba(220, 53, 69, 0.8)',
      'Slightly Negative': 'rgba(255, 193, 7, 0.8)',
      Neutral: 'rgba(108, 117, 125, 0.8)',
      'Slightly Positive': 'rgba(13, 202, 240, 0.8)',
      'Very Positive': 'rgba(25, 135, 84, 0.8)',
    };

    return colorMap[categoryName] || 'gray';
  }

  showCategoriesModal(categories: any[]): void {
    console.log('Categories:', categories);
    this.selectedCategories = categories;
    this.showCategoryModal = true;

    console.log('Categories:', categories);
    setTimeout(() => {
      this.showCategoryModal = false;
    }, 3000);
  }

  pollFileStatus(fileId: string): void {
    // Cancel existing subscription for this file if it exists
    if (this.fileStatusSubscriptions.has(fileId)) {
      this.fileStatusSubscriptions.get(fileId)?.unsubscribe();
    }

    // Set up initial polling variable
    let completedOrError = false;

    // Start new polling subscription
    const subscription = interval(2000)
      .pipe(takeWhile(() => !completedOrError))
      .subscribe({
        next: () => {
          this.predictionService.checkFileStatus(fileId).subscribe({
            next: (status) => {
              if (status.status === 'completed') {
                // File is now completed
                completedOrError = true;

                // Remove from pending files
                this.pendingFiles = this.pendingFiles.filter(
                  (file) => file.id !== fileId
                );

                // Refresh the files list to get the new completed file
                this.refreshFilesList();

                // Clean up the subscription
                if (this.fileStatusSubscriptions.has(fileId)) {
                  this.fileStatusSubscriptions.get(fileId)?.unsubscribe();
                  this.fileStatusSubscriptions.delete(fileId);
                }
              } else if (status.status === 'error') {
                // Handle error state
                completedOrError = true;
                this.pendingFiles = this.pendingFiles.filter(
                  (file) => file.id !== fileId
                );

                // Use safe access for the message property since it might not exist
                alert(
                  `Processing of file failed: ${
                    (status as any).message || 'Unknown error'
                  }`
                );

                // Clean up the subscription
                if (this.fileStatusSubscriptions.has(fileId)) {
                  this.fileStatusSubscriptions.get(fileId)?.unsubscribe();
                  this.fileStatusSubscriptions.delete(fileId);
                }
              }
              // For 'pending' status, we just keep polling
            },
            error: (error) => {
              console.error('Error checking file status:', error);
              completedOrError = true; // Stop polling on error

              // Clean up the subscription
              if (this.fileStatusSubscriptions.has(fileId)) {
                this.fileStatusSubscriptions.get(fileId)?.unsubscribe();
                this.fileStatusSubscriptions.delete(fileId);
              }
            },
          });
        },
      });

    // Store the subscription
    this.fileStatusSubscriptions.set(fileId, subscription);
  }

  refreshFilesList(): void {
    this.predictionService.getFiles().subscribe({
      next: (response) => {
        if (!response) {
          console.error('Received null response from getFiles()');
          return;
        }

        // Update pending files - ensure we don't have duplicates
        const pendingFileIds = new Set(
          this.pendingFiles.map((file) => file.id)
        );

        // Only add files that aren't already in our pending list
        if (response.pendingFiles && Array.isArray(response.pendingFiles)) {
          response.pendingFiles.forEach((file) => {
            if (!pendingFileIds.has(file.id)) {
              this.pendingFiles.push({
                id: file.id,
                name: file.name,
                timestamp: new Date(file.timestamp),
              });
            }
          });

          // Also ensure we remove any files that are no longer pending
          const apiPendingFileIds = new Set(
            response.pendingFiles.map((file: any) => file.id)
          );
          this.pendingFiles = this.pendingFiles.filter((file) =>
            apiPendingFileIds.has(file.id)
          );
        }

        // Update completed files
        if (response.completedFiles && Array.isArray(response.completedFiles)) {
          this.myFiles = response.completedFiles.map((file) => ({
            id: file.id,
            name: file.name,
            status: 'completed',
            timestamp: new Date(file.timestamp),
            isDefault: false,
            data: [], // Empty initially, will be loaded when file is selected
            chartData: undefined, // Will be generated when data is loaded
          }));
        }

        // Update filtered files
        this.filterFiles();

        // Trigger change detection to update the UI
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching files:', error);
        this.cdr.detectChanges();
      },
    });
  }

  generateChartDataFromApiResponse(fileDetails: any): ChartData {
    if (!fileDetails || !fileDetails.data) {
      // Return empty chart data when no details are available
      return {
        labels: [],
        datasets: [{
          label: 'No Data Available',
          backgroundColor: [],
          borderColor: 'rgba(179,181,198,1)',
          data: []
        }]
      };
    }

    // Assuming the API returns data with sentiment categories and counts
    const sentimentCounts: Record<string, number> = {
      'Very Positive': 0,
      'Slightly Positive': 0,
      Neutral: 0,
      'Slightly Negative': 0,
      'Very Negative': 0,
    };

    // Count prediction categories
    if (Array.isArray(fileDetails.data)) {
      fileDetails.data.forEach((item: any) => {
        const prediction = item?.Prediction;
        // Check if prediction exists and is a key in sentimentCounts
        if (
          prediction &&
          Object.prototype.hasOwnProperty.call(sentimentCounts, prediction)
        ) {
          sentimentCounts[prediction as keyof typeof sentimentCounts]++;
        }
      });
    }

    return {
      labels: Object.keys(sentimentCounts),
      datasets: [
        {
          label: 'Sentiment Distribution',
          backgroundColor: [
            'rgba(25, 135, 84, 0.8)', // Very Positive - green
            'rgba(13, 202, 240, 0.8)', // Slightly Positive - info blue
            'rgba(108, 117, 125, 0.8)', // Neutral - gray
            'rgba(255, 193, 7, 0.8)', // Slightly Negative - amber
            'rgba(220, 53, 69, 0.8)', // Very Negative - red
          ],
          borderColor: 'rgba(179,181,198,1)',
          data: Object.values(sentimentCounts),
        },
      ],
    };
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.fileStatusSubscriptions.forEach((sub) => sub.unsubscribe());
    this.fileStatusSubscriptions.clear();
  }

  navigateToTab(tab: string): void {
    this.router.navigate(['/dashboard', tab]);
  }

  navigateToSubscription(): void {
    console.log('Navigating to subscription page...');
    
    // Use the router to navigate programmatically
    this.router.navigate(['/subscription']).then(success => {
      // Log whether navigation was successful for debugging
      console.log('Navigation success:', success);
      
      if (!success) {
        // If navigation fails, try an alternative approach
        console.error('Navigation failed, trying window.location');
        window.location.href = '/subscription';
      }
    }).catch(err => {
      console.error('Navigation error:', err);
    });
  }
  
  get hasBulkAccess(): boolean {
    return this.subscriptionService.hasBulkAccess();
  }

  switchTab(tab: string): void {
    // Prevent tab switching if currently loading a file
    if (this.isLoadingFile) {
      return;
    }

    // Reset chart state when switching tabs
    this.isChartReady = false;
    
    // Always allow switching to the tab, even without access
    this.activeTab = tab;
    
    // Navigate without reloading the component
    this.router.navigate(['/dashboard', tab], { 
      skipLocationChange: false,
      replaceUrl: false
    });

    // Reset chart ready state after navigation
    setTimeout(() => {
      this.isChartReady = true;
      this.cdr.detectChanges();
    }, 300);
  }


  downloadFile(fileId: string): void {
    this.predictionService.downloadFile(fileId).subscribe({
      next: (response) => {
        // Handle successful download
        console.log('File downloaded successfully:', response);
      },
      error: (error) => {
        // Handle error
        console.error('Error downloading file:', error);
      }
    });
  }
}