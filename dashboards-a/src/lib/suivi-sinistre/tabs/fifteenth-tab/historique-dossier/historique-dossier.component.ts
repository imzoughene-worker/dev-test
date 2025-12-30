import { Component, computed, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KENDO_GRID } from '@progress/kendo-angular-grid';
import { DelaiTraitementDto, SuiviSinistreClient } from '@portals/client-reporting';
import { BehaviorSubject, EMPTY, Observable, switchMap, take, tap } from 'rxjs';
import { infoSolidIcon, xIcon } from '@progress/kendo-svg-icons';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { TypeRetourCieEnum } from '@portals/client-mobile';
import { DateLongPipe } from '@portals/base/core/pipes';
import { EnvironmentService, MyUserService } from '@portals/base/core/core-component';
import { KENDO_INTL } from '@progress/kendo-angular-intl';
import dayjs from 'dayjs';
import { AppModeService } from '@portals/base/core/shared-services';

@Component({
  selector: 'portals-historique-dossier',
  imports: [CommonModule, KENDO_GRID, DateLongPipe, KENDO_BUTTON, KENDO_INTL],
  templateUrl: './historique-dossier.component.html',
  styleUrl: './historique-dossier.component.scss',
  providers: [DateLongPipe, MyUserService],
})
export class HistoriqueDossierComponent {
  classerId$ = new BehaviorSubject<number>(0);
  typeRetourCie = TypeRetourCieEnum;

  @Input() set classeurId(value: number) {
    this.classerId$.next(value);
  }

  protected readonly infoSolidIcon = infoSolidIcon;

  client = inject(SuiviSinistreClient);
  appMode = inject(AppModeService);
  delaisTraitement$: Observable<DelaiTraitementDto[]> = this.classerId$.pipe(
    take(1),
    switchMap((classeurId) => this.getDetais(classeurId))
  );

  getDetais(classeurId: number) {
    return this.client.getDelaiTraitementParVersionDossier(classeurId, '1.0').pipe(
      take(1),
      tap({
        next: (result) => {
          return result;
        },
        error: (err) => {
          return EMPTY;
        },
      })
    );
  }

  getTitle(dataItem: any, isCompany = false) {
    const dateDeReception = dataItem.dateDeReception ? dayjs(dataItem.dateDeReception).format('DD/MM/YYYY HH:mm') : '-';
    const isNonRemb = [
      this.typeRetourCie[10],
      this.typeRetourCie[11],
      this.typeRetourCie[12],
      this.typeRetourCie[13],
      this.typeRetourCie[14],
    ].includes(dataItem.typeRetour);
    const dtFinal = isCompany ? dataItem?.dateRemboursement : dataItem.dateRemFinal;
    const dateRemFinal = dtFinal ? dayjs(dtFinal).format('DD/MM/YYYY HH:mm') : '-';
    if (isCompany) {
      return `- Date Réception  : ${dateDeReception}\n- Date Réglement : ${dateRemFinal}`;
    }
    return (
      `- Date Réception Souscripteur : ${dateDeReception}\n` +
      `- Date ${isNonRemb ? 'Clôture Réponse Cie Non Remb' : 'Remboursement'} : ${dateRemFinal}`
    );
  }

  userService = inject(MyUserService);
  isSouscripteur = inject(EnvironmentService).isSouscripteurClient;

  checkAccess() {
    return this.userService.hasLevel('PSD', 2);
  }

  readonly isCompany = computed(() => this.appMode._appMode()?.isCompanyMode);

  protected readonly xIcon = xIcon;
}
