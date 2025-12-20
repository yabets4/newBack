import model from './report.model.js';
export default {
  list:(p,o)=>model.findAll(p,o),
  get:(p,id)=>model.findById(p,id),
  create:(p,d)=>model.create(p,d),
  update:(p,id,d)=>model.update(p,id,d),
  remove:(p,id)=>model.remove(p,id),
};
