import json


class Energy:

    def __init__(self, file_path) -> None:
        self.file_path = file_path
        self.file = open("energy.csv", "r")
        self.title = []

        for i in self.read_line().split(","):
            if "\n" in i:
                i = i.replace("\n", "")
                self.title.append(i)
            else:
                self.title.append(i)

    def read_line(self):
        line = self.file.readline()
        if "\n" in line:
            line = line.replace("\n", "")
        return line if line != "" else False

    def convertToJson(self):
        data = []
        while True:
            line = self.read_line()
            if line is False:
                break

            line = line.split(',')
            final_str = '{'

            for i in range(len(line)):
                for i in range(len(line)):
                    if line[i] != '':
                        final_str += f'"{self.title[i]}":"{line[i]}", '

            final_str = final_str[:-2]  # retirar a última vírgula
            final_str += '}'

            final_str = json.loads(final_str)

            data.append(final_str)
        return data

    def joinPerCountry(self):
        data = self.convertToJson()
        countries = {}

        for i in data:
            if i["country"] not in countries.keys():
                countries[i["country"]] = [i]
            else:
                countries[i["country"]].append(i)

        return countries

    def __del__(self) -> None:
        self.file.close()


if __name__ == '__main__':
    energy = Energy('energy.csv')

    all_data = energy.joinPerCountry()

    
    tmp_str = "["
    for i in all_data.keys():
        tmp_str += f'{{"{i}":{all_data[i]}}}, '

    tmp_str = tmp_str[:-2]  # retirar a última vírgula
    tmp_str += "]"
    print(tmp_str)
