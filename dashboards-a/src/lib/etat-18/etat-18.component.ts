import { Component, DestroyRef, Inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Etat18Filters } from '@portals/client-reporting';
import { BehaviorSubject, catchError, combineLatest, defer, EMPTY, map, skipWhile, switchMap, take, tap } from 'rxjs';
import { Etat18Service } from './services/etat-18.service';
import {
  ErrorHandlerService,
  ErrorManagerService,
  exportSceneBlob,
  ITrigramme,
  NotifService,
  TRIGRAMME,
} from '@portals/base/core/core-component';
import { downloadIcon, infoCircleIcon } from '@progress/kendo-svg-icons';
import { debounceTime } from 'rxjs/operators';
import { ConfirmationPopupService } from '@portals/base/shared/shared-component';
import { KENDO_CARD } from '@progress/kendo-angular-layout';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { GlobalErrorsComponent } from '@portals/base/shared/error-management';
import { KENDO_FORMFIELD, KENDO_SWITCH } from '@progress/kendo-angular-inputs';
import { KENDO_LABEL } from '@progress/kendo-angular-label';
import { KENDO_MULTISELECT } from '@progress/kendo-angular-dropdowns';
import { AsyncPipe } from '@angular/common';
import { KENDO_DATEINPUT, KENDO_DATERANGE } from '@progress/kendo-angular-dateinputs';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KENDO_TOOLTIP } from '@progress/kendo-angular-tooltip';
import { KENDO_SVGICON } from '@progress/kendo-angular-icons';

@Component({
  selector: 'portals-etat-18',
  templateUrl: './etat-18.component.html',
  providers: [Etat18Service],
  imports: [
    KENDO_CARD,
    KENDO_BUTTON,
    GlobalErrorsComponent,
    ReactiveFormsModule,
    KENDO_FORMFIELD,
    KENDO_LABEL,
    KENDO_MULTISELECT,
    AsyncPipe,
    KENDO_DATERANGE,
    KENDO_DATEINPUT,
    KENDO_SWITCH,
    KENDO_TOOLTIP,
    KENDO_SVGICON,
  ],
})
export class Etat18Component {
  constructor(
    private service: Etat18Service,
    private errorHandler: ErrorHandlerService,
    private notification: NotifService,
    private confirmation: ConfirmationPopupService,
    private _activatedRoute: ActivatedRoute,
    private _destroyRef: DestroyRef,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme
  ) {
    this._activatedRoute.data
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map((data) => data['disableValidation']),
        tap((disableValidation) => {
          const souscripteurs = this.createForm.get('souscripteurs');
          const polices = this.createForm.get('polices');
          if (disableValidation) {
            souscripteurs?.clearValidators();
            polices?.clearValidators();
          } else {
            souscripteurs?.setValidators([Validators.required]);
            polices?.setValidators([Validators.required]);
          }
          souscripteurs?.updateValueAndValidity();
          polices?.updateValueAndValidity();
        })
      )
      .subscribe();
  }

  filterLoading = false;

  public souscripteurSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  filteredSouscripteurs = this.souscripteurSubject.pipe(
    debounceTime(400),
    tap(() => (this.filterLoading = true)),
    switchMap((value) => this.service.getSouscripteur(value)),
    tap(() => (this.filterLoading = false))
  );
  public policesSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  filteredPolices = this.policesSubject.pipe(
    debounceTime(400),
    tap(() => (this.filterLoading = true)),
    switchMap((value) => this.service.getPolices(value, this.createForm.get('souscripteurs')?.value ?? [])),
    tap(() => (this.filterLoading = false))
  );
  handlePolice = defer(() => this.createForm.controls['souscripteurs'].valueChanges).pipe(
    tap((value) => {
      if (!value || value.length <= 0) {
        this.createForm.get('polices')?.patchValue([]);
        this.createForm.get('polices')?.disable();
        this.createForm.updateValueAndValidity();
      } else {
        this.createForm.get('polices')?.enable();
        this.createForm.updateValueAndValidity();
      }
    })
  );
  createForm = new FormGroup({
    souscripteurs: new FormControl<string[]>([], { nonNullable: true }),
    polices: new FormControl<string[]>({ value: [], disabled: true }, { nonNullable: true }),
    startingDate: new FormControl<Date>(new Date(), { validators: [Validators.required], nonNullable: true }),
    endDate: new FormControl<Date>(new Date(), { validators: [Validators.required], nonNullable: true }),
    filtreNC: new FormControl<boolean>(false),
  });

  startDate$: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());
  endDate$: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());
  dateRange$ = combineLatest([this.startDate$, this.endDate$]).pipe(
    tap(([startDate, endDate]) => {
      this.createForm.get('startingDate')?.setValue(startDate ?? new Date());
      this.createForm.get('endDate')?.setValue(endDate ?? new Date());
    })
  );

  globalErrors = signal<string[]>([]);
  handleGenerate = () => {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
    } else {
      this.globalErrors.set([]);
      this.createForm.updateValueAndValidity();
      this.confirmation
        .openDialog('Etat 18', 'Merci de confirmer votre choix')
        .pipe(
          skipWhile((decision) => {
            return !decision;
          }),
          take(1),
          map(() => {
            return new Etat18Filters({
              souscripteurs: this.createForm.get('souscripteurs')?.value ?? [],
              polices: this.createForm.get('polices')?.value ?? [],
              startingDate: this.createForm.value.startingDate ?? new Date(),
              endDate: this.createForm.value.endDate ?? new Date(),
              filtreNC: this.trigramme.authority === 'AZM' ? this.createForm.value.filtreNC! : false,
            });
          }),
          switchMap((model) => this.service.generateEtat18(model)),
          catchError((err) => {
            this.globalErrors.update(() => this.errorHandler.handleGlobalError(err));
            return EMPTY;
          })
        )
        .subscribe({
          next: (data) => {
            if (!ErrorManagerService.pipeContainsErrors(data)) {
              this.notification.success("L'état 18 a été généré avec succès");
              exportSceneBlob(data);
            }
          },
          error: () => {
            this.notification.error('Une erreure est survenue. Veuillez réessayer plus tard');
          },
        });
    }
  };

  protected readonly downloadIcon = downloadIcon;
  protected readonly infoCircleIcon = infoCircleIcon;
}
