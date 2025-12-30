import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { MultiGraphDto } from '@portals/client-reporting';
import { WindowService } from '@progress/kendo-angular-dialog';
import { NgTemplateOutlet } from '@angular/common';
import { KENDO_PROGRESSBAR } from '@progress/kendo-angular-progressbar';
import { KENDO_CHART } from '@progress/kendo-angular-charts';

@Component({
    selector: 'portals-multigraph-chart',
    templateUrl: './multigraph-chart.component.html',
    styleUrls: ['./multigraph-chart.component.scss'],
    providers: [WindowService],
    imports: [NgTemplateOutlet, KENDO_PROGRESSBAR, KENDO_CHART]
})
export class MultigraphChartComponent {
  @Input() title = '';
  @Input() data: MultiGraphDto | null = null;
  @Input() isLoading = false;
  @ViewChild('dataContainer') dataContainer: TemplateRef<any> | undefined;

  constructor(private windowService: WindowService) {}

  expandCard(container: TemplateRef<any>) {
    this.windowService.open({
      height: 600,
      width: 1000,
      title: this.title,
      state: 'maximized',
      resizable: false,
      content: container,
    });
  }
}
