import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { GraphDto } from '@portals/client-reporting';
import { WindowService } from '@progress/kendo-angular-dialog';
import { NgTemplateOutlet } from '@angular/common';
import { KENDO_PROGRESSBAR } from '@progress/kendo-angular-progressbar';
import { KENDO_CHART, SeriesType } from '@progress/kendo-angular-charts';

@Component({
  selector: 'portals-graph-chart',
  templateUrl: './graph-chart.component.html',
  styleUrls: ['./graph-chart.component.scss'],
  providers: [WindowService],
  imports: [NgTemplateOutlet, KENDO_PROGRESSBAR, KENDO_CHART],
})
export class GraphChartComponent {
  @Input() type: SeriesType = 'column';
  @Input() title = '';
  @Input() data: GraphDto | null = null;
  @Input() isLoading = false;
  @ViewChild('dataContainer') dataContainer?: TemplateRef<any>;

  formatNumber(n: number) {
    const res = n.toLocaleString('fr-FR');
    return res;
  }
}
