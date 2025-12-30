import { AsyncPipe } from '@angular/common';
import { Component, computed, DestroyRef, OnInit, TemplateRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { UntypedFormControl } from '@angular/forms';
import { exportSceneBlob, MyUserService, RoleService, toDateFormat } from '@portals/base/core/core-component';
import { GridPersistanceDirective } from '@portals/base/core/directives';
import { DateLongPipe } from '@portals/base/core/pipes';
import { RoleEnum } from '@portals/client-identity';
import {
  AffiliationFilter,
  DateParameters,
  IAffiliationFilter,
  PopulationClientClient,
} from '@portals/client-reporting';
import { KENDO_BUTTON, KENDO_CHIP } from '@progress/kendo-angular-buttons';
import { WindowService } from '@progress/kendo-angular-dialog';
import { DataStateChangeEvent, KENDO_GRID } from '@progress/kendo-angular-grid';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { KENDO_RIPPLE } from '@progress/kendo-angular-ripple';
import { fileExcelIcon } from '@progress/kendo-svg-icons';
import { BehaviorSubject, take } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DashboardFields } from '../../../dashboard-model';
import { AdhesionSortanteService } from '../../services/adhesion-sortante.data.service';
import { PopulationClientService } from '../../services/population-client.service';

@Component({
  selector: 'portals-twenty-twoth-tab',
  templateUrl: './twenty-twoth-tab.component.html',
  styleUrls: ['./twenty-twoth-tab.component.scss'],
  imports: [
    KENDO_TILELAYOUT,
    KENDO_RIPPLE,
    KENDO_BUTTON,
    KENDO_GRID,
    AsyncPipe,
    GridPersistanceDirective,
    DateLongPipe,
    KENDO_CHIP,
  ],
})
export class TwentyTwothTabComponent implements OnInit {
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 1 }).map((x) => new BehaviorSubject<boolean>(false));

  PGD = toSignal(this.myUser.hasLevel('PGD', 2));
  CDA = toSignal(this.myUser.hasLevel('CDA', 2));
  PSD = toSignal(this.myUser.hasLevel('PSD', 2));

  hasAccess = computed(() => {
    switch (this.roleService.currentRole()) {
      case RoleEnum.Intranet:
        return this.CDA();
      case RoleEnum.Gestionnaire:
        return this.PGD();
      case RoleEnum.Souscripteur:
        return this.PSD();
      default:
        return false;
    }
  });

  constructor(
    private popClient: PopulationClientClient,
    public adhesionSortanteService: AdhesionSortanteService,
    public populationClientService: PopulationClientService,
    private windowService: WindowService,
    private destroyRef: DestroyRef,
    private myUser: MyUserService,
    private roleService: RoleService
  ) {}

  editMode = false;

  expandCard(container: TemplateRef<any>, text: string) {
    this.windowService.open({
      height: 600,
      width: 1000,
      title: text,
      state: 'maximized',
      resizable: false,
      content: container,
    });
  }

  public getField(name: string): UntypedFormControl {
    return <UntypedFormControl>this.populationClientService.formFilter.get(name);
  }

  ngOnInit(): void {
    this.adhesionSortanteService.reset();
    this.populationClientService.affiliationFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: IAffiliationFilter | null) => {
        if (queryObject == null) return;
        // variable non utilisée
        // let query = {
        //   filters: queryObject
        // };
        this.updateAdhesionsSortantes(queryObject);
      });
  }

  //DEBUT GRILLE ADHESION SORTANTE

  public raffrachirAdhesionsSortantes(): void {
    this.adhesionSortanteService.refresh(this.getFilter());
  }

  public dataStateChangeAdhesionSortantes(state: DataStateChangeEvent): void {
    this.adhesionSortanteService.state = state;
    this.adhesionSortanteService.read(this.getFilter());
  }

  updateAdhesionsSortantes(query: IAffiliationFilter): void {
    this.adhesionSortanteService.refresh(query);
  }

  isExporting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportAdhesionsSortantes(): void {
    const exportAccordPrealable = AffiliationFilter.fromJS(this.getFilter());
    this.isExporting.next(true);
    this.popClient
      .exportDetailsAdhesionSortantes('1.0', exportAccordPrealable)
      .pipe(
        take(1),
        finalize(() => this.isExporting.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE ADHESION SORTANTE

  public getFilter(): IAffiliationFilter {
    return <IAffiliationFilter>{
      souscripteurs: this.getField(DashboardFields.Souscripteur).value,
      anneeAdhesions: this.getField(DashboardFields.AnneeAdhesion).value,
      numeroAdhesions: this.getField(DashboardFields.NumeroAdhesion).value,
      polices: this.getField(DashboardFields.Police).value,
      status: this.getField(DashboardFields.Status).value,
      trimestreAdhesions: this.getField(DashboardFields.TrimestreAdhesion).value,
      dateParameters: <DateParameters>{
        startingDate: <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value),
        endDate: <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value),
      },
    };
  }

  protected readonly fileExcelIcon = fileExcelIcon;
}
