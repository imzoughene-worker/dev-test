import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { MetricDto } from '@portals/client-reporting';
import { roundNumberWith2Decimals } from '@portals/base/core/core-component';
import { WindowService } from '@progress/kendo-angular-dialog';
import { NgTemplateOutlet } from '@angular/common';
import { KENDO_ARCGAUGE, KENDO_CIRCULARGAUGE } from '@progress/kendo-angular-gauges';

@Component({
    selector: 'portals-gauge-chart',
    templateUrl: './gauge-chart.component.html',
    styleUrls: ['./gauge-chart.component.scss'],
    providers: [WindowService],
    imports: [NgTemplateOutlet, KENDO_ARCGAUGE, KENDO_CIRCULARGAUGE]
})
export class GaugeChartComponent {
  @Input() type = 'arc';
  @Input() title = '';
  @Input() data: MetricDto | null = null;
  @Input() isLoading = false;
  @ViewChild('data') dataContainer: TemplateRef<any> | undefined;

  get principaleFormatted(): string {
    return this.data?.valuePrincipale ? roundNumberWith2Decimals(this.data?.valuePrincipale) : 'N/A';
  }

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
