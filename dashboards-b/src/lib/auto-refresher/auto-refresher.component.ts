import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { EnvironmentService } from '@portals/base/core/core-component';
import { KENDO_FORMFIELD, KENDO_SWITCH } from '@progress/kendo-angular-inputs';
import { FormsModule } from '@angular/forms';
import { KENDO_LABEL } from '@progress/kendo-angular-label';
import { BehaviorSubject, EMPTY, interval, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'portals-auto-refresher',
  templateUrl: './auto-refresher.component.html',
  styleUrls: ['./auto-refresher.component.scss'],
  imports: [KENDO_FORMFIELD, KENDO_SWITCH, FormsModule, KENDO_LABEL],
})
export class AutoRefresherComponent implements OnInit, OnDestroy {
  @Input() initialValue = false;
  @Input() triggerIntervalInMs: number = 1000 * 60;
  @Output() refreshTriggered: EventEmitter<boolean> = new EventEmitter();
  public checked = false;
  public isInterne: boolean | undefined;
  private readonly destroy$ = new Subject<void>();
  private readonly autoRefresh$ = new BehaviorSubject<boolean>(false);

  constructor(public env: EnvironmentService) {
    this.isInterne = this.env.activePortalClient === 'portail-souscripteur' ? false : true;
  }

  ngOnInit(): void {
    this.checked = this.initialValue;
    this.autoRefresh$
      .pipe(
        switchMap((active) => (active ? interval(this.triggerIntervalInMs) : EMPTY)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.refreshTriggered.emit(true));
    this.handleCheckActivation();
  }

  public handleCheckActivation() {
    this.autoRefresh$.next(this.checked);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.autoRefresh$.complete();
    this.checked = false;
  }
}
