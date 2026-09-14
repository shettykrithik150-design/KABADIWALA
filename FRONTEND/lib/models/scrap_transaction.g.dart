// GENERATED CODE style file — written by hand to match what
// `flutter pub run build_runner build` would produce for ScrapTransaction.
// If you ever add/remove fields, delete this file and regenerate with:
//   flutter pub run build_runner build --delete-conflicting-outputs

part of 'scrap_transaction.dart';

class ScrapTransactionAdapter extends TypeAdapter<ScrapTransaction> {
  @override
  final int typeId = 0;

  @override
  ScrapTransaction read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ScrapTransaction(
      id: fields[0] as String,
      materialType: fields[1] as String,
      weightKg: fields[2] as double,
      estimatedValue: fields[3] as double,
      recyclerId: fields[4] as String?,
      recyclerName: fields[5] as String?,
      latitude: fields[6] as double?,
      longitude: fields[7] as double?,
      timestamp: fields[8] as DateTime,
      paymentStatus: fields[9] as String,
      photoPath: fields[10] as String?,
      synced: fields[11] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, ScrapTransaction obj) {
    writer
      ..writeByte(12)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.materialType)
      ..writeByte(2)
      ..write(obj.weightKg)
      ..writeByte(3)
      ..write(obj.estimatedValue)
      ..writeByte(4)
      ..write(obj.recyclerId)
      ..writeByte(5)
      ..write(obj.recyclerName)
      ..writeByte(6)
      ..write(obj.latitude)
      ..writeByte(7)
      ..write(obj.longitude)
      ..writeByte(8)
      ..write(obj.timestamp)
      ..writeByte(9)
      ..write(obj.paymentStatus)
      ..writeByte(10)
      ..write(obj.photoPath)
      ..writeByte(11)
      ..write(obj.synced);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScrapTransactionAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
