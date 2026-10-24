import mongoose from 'mongoose';

const peachLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  peachesCount: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  weightGrams: {
    type: Number,
    default: 150
  },
  mealType: {
    type: String,
    enum: ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack'],
    default: 'Snack'
  },
  nutrients: {
    kcal: { type: Number, default: 63 },
    fiberGrams: { type: Number, default: 2.3 },
    vitCPercent: { type: Number, default: 17 },
    waterPercent: { type: Number, default: 89 }
  }
}, {
  timestamps: true
});

peachLogSchema.index({ user: 1, date: -1 });

const PeachLog = mongoose.model('PeachLog', peachLogSchema);
export default PeachLog;
