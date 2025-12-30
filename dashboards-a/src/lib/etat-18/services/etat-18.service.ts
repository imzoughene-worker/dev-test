import { inject, Injectable } from '@angular/core';
import {
  Etat18Filters,
  GetPolicesSinistreQuery,
  GetSouscripteursSinistreQuery,
  ReferentielClient,
  SuiviSinistreClient,
} from '@portals/client-reporting';

@Injectable()
export class Etat18Service {
  client = inject(SuiviSinistreClient);
  refClient = inject(ReferentielClient);

  generateEtat18(model: Etat18Filters) {
    return this.client.generateEtat18('1.0', model);
  }

  getSouscripteur(keyword: string) {
    return this.refClient.getSouscripteursSinistre(
      '1.0',
      GetSouscripteursSinistreQuery.fromJS({
        keyword,
      })
    );
  }

  getPolices(keyword: string, souscripteurs: string[]) {
    return this.refClient.getPolicesSinistre(
      '1.0',
      GetPolicesSinistreQuery.fromJS({
        keyword,
        souscripteurs,
      })
    );
  }
}
