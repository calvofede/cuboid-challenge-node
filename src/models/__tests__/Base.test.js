import Base from '../Base';

it('should contain "/src/models" in modelPaths', () => {
  expect(Base.modelPaths[0]).toContain('\\src\\models');
});
