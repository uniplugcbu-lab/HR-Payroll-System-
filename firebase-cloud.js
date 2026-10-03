/* Firebase data layer for MASITECH Payroll. */
(function () {
  "use strict";

  window.MasitechCloud = {
    ready: false,
    db: null,
    auth: null,

    init: function () {
      if (!window.firebase || !window.MASITECH_FIREBASE_CONFIG) return false;
      var c = window.MASITECH_FIREBASE_CONFIG;
      if (!c.apiKey || !c.projectId || !c.appId) return false;
      try {
        if (!firebase.apps.length) firebase.initializeApp(c);
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.ready = true;
        return true;
      } catch (e) {
        console.error("Firebase initialization failed:", e);
        return false;
      }
    },

    organizationRef: function (uid) {
      return this.db.collection("organizations").doc(uid);
    },

    settingsRef: function (uid) {
      return this.organizationRef(uid).collection("data").doc("settings");
    },

    employeesRef: function (uid) {
      return this.organizationRef(uid).collection("employees");
    },

    payrollsRef: function (uid) {
      return this.organizationRef(uid).collection("payrolls");
    },

    statutoryUpdatesRef: function (uid) {
      return this.organizationRef(uid).collection("statutoryUpdates");
    },

    memberRef: function (uid) {
      return this.organizationRef(uid).collection("members").doc(uid);
    },

    saveOrganization: function (user, data) {
      return this.organizationRef(user.uid).set(
        Object.assign({}, data, {
          ownerUid: user.uid,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }),
        { merge: true }
      );
    },

    saveMember: function (user, data) {
      return this.memberRef(user.uid).set(
        Object.assign({}, data, {
          uid: user.uid,
          role: "owner",
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }),
        { merge: true }
      );
    },

    saveSettings: function (user, data) {
      return this.settingsRef(user.uid).set(
        Object.assign({}, data, {
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }),
        { merge: true }
      );
    },

    loadWorkspace: async function (user) {
      var orgSnap = await this.organizationRef(user.uid).get();
      var settingsSnap = await this.settingsRef(user.uid).get();
      var employeesSnap = await this.employeesRef(user.uid).orderBy("createdAt", "desc").get();
      var payrollsSnap = await this.payrollsRef(user.uid).orderBy("createdAt", "desc").get();
      var updatesSnap = await this.statutoryUpdatesRef(user.uid).orderBy("recordedAt", "desc").get();

      return {
        organization: orgSnap.exists ? orgSnap.data() : {},
        settings: settingsSnap.exists ? settingsSnap.data() : {},
        employees: employeesSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }),
        payrolls: payrollsSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }),
        statutoryUpdates: updatesSnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })
      };
    },

    addEmployee: function (user, employee) {
      return this.employeesRef(user.uid).add(Object.assign({}, employee, {
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
    },

    updateEmployee: function (user, id, employee) {
      return this.employeesRef(user.uid).doc(id).set(
        Object.assign({}, employee, { updatedAt: firebase.firestore.FieldValue.serverTimestamp() }),
        { merge: true }
      );
    },

    deleteEmployee: function (user, id) {
      return this.employeesRef(user.uid).doc(id).delete();
    },

    addPayroll: function (user, payroll) {
      return this.payrollsRef(user.uid).add(Object.assign({}, payroll, {
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
    },

    addStatutoryUpdate: function (user, update) {
      return this.statutoryUpdatesRef(user.uid).add(Object.assign({}, update, {
        recordedAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
    }
  };
})();
