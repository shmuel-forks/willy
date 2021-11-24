import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit } from '@angular/core';
import { NotifierService } from 'angular-notifier';
import Chart from 'chart.js/auto'
import { plugins } from 'chartist';
import { throwError } from 'rxjs';
import { Observable } from 'rxjs-compat';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';


@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements AfterViewInit {

	private apiURL = environment.apiURL;

	private ctxRuningContainers = 'runingContainers';
	
	private ctxContainersInfo = 'containersInfo';

	public containersChart: Chart | undefined;
	
	public containersInfoChart: Chart | undefined;

	public dashboard: any;

	public refreshInterval = 10;

	constructor(private http: HttpClient,
		private notifierService: NotifierService) { }

	ngAfterViewInit() {

		this.containersChart = new Chart(this.ctxRuningContainers, {
			type: 'line',
			data: {
				labels: [''],
				datasets: [{
					data: [0],
					borderColor: '#63de9f',
					fill: true,
					backgroundColor: '#63de9491',
					borderWidth: 2,
				}]
			},
			options: {
				scales: {
					y: {
						beginAtZero: true,
					},
				},
				plugins: {
					legend: {
						display: false
					}
				}
			}
		});

		this.getDashboard()
			.subscribe((response: any) => {
				this.dashboard = response;
				this.updateChart()
			})

		const refreshContainer$ = Observable.of(null)
			.switchMap(e => this.refreshObs())
			.map(() => {
				this.getDashboard()
					.subscribe(
						(response: any) => {
							this.dashboard = response;
							this.updateChart()
						},
						(error: any) => {
							this.notifierService.notify('error', `Failed to list containers: ${error.message}`)
						})
			})
			.repeat();

		refreshContainer$.subscribe(t => {
			const currentTime = t;
			console.log('refresh interval = ' + this.refreshInterval);
		});

	}

	refreshObs() { return Observable.timer(this.refreshInterval * 1000) }


	// HttpClient API get() method => Fetch dashboard
	getDashboard(): Observable<any> {
		return this.http.get<any>(this.apiURL + '/dashboard/')
			.pipe(
				catchError((err) => {
					console.log(err)
					return throwError(err)
				})
			)
	}

	updateChart() {

		this.containersChart?.data.labels?.push('')
		this.containersChart?.data.datasets.forEach((datasets) => {
			datasets.data.push(this.dashboard.running)
		})

		this.containersChart?.update()

		this.containersInfoChart?.destroy()

		const backgroundColor: any[] = [];

		if(this.dashboard?.running > 0){
			
			backgroundColor.push('rgb(54, 162, 235)')
		}

		if(this.dashboard?.paused > 0){
			
			backgroundColor.push('rgb(255, 205, 86)')
		}

		if(this.dashboard?.stopped > 0){
			
			backgroundColor.push('rgb(255, 99, 132')
		}

		this.containersInfoChart = new Chart(this.ctxContainersInfo, {
			type: 'doughnut',
			data: {
				labels: [],
				datasets: [{
					data: [],
					backgroundColor: backgroundColor,
				}],

			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						position: "bottom"
					}
				}
			}

		});
		
		if(this.dashboard?.running > 0){
			this.containersInfoChart?.data.labels?.push('Running')	
			this.containersInfoChart?.data.datasets[0].data.push(this.dashboard?.running)
		}

		if(this.dashboard?.paused > 0){
			this.containersInfoChart?.data.labels?.push('Paused')	
			this.containersInfoChart?.data.datasets[0].data.push(this.dashboard?.paused)
		}
		if(this.dashboard?.stopped > 0){
			this.containersInfoChart?.data.labels?.push('Stopped')	
			this.containersInfoChart?.data.datasets[0].data.push(this.dashboard?.stopped)
		}

		this.containersInfoChart?.update()
	}

}
