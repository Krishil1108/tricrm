describe('Smoke Test', () => {
  it('loads the login page successfully', () => {
    cy.visit('/');
    cy.contains('Sign In');
  });
});
